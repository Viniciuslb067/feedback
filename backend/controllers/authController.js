const express = require("express");
const jwt = require("jsonwebtoken");
const ldap = require("ldapjs");

const authConfig = require("../config/auth.json");

const User = require("../models/User");
const Lgpd = require("../models/Lgpd");

const router = express.Router();

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: "1d",
  });
}

router.get("/me/:token", async (req, res) => {
  var userEmail;

  jwt.verify(req.params.token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido" });
    }
    userEmail = decoded.email;
  });

  const user = await User.findOne({ email: `${userEmail}@inss.gov.br` });

  return res.status(200).json({ user });
});

router.post("/terms", async (req, res) => {
  const { osName, osVersion, browserName, browserVersion } = req.body;

  const getIp =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  const ip = getIp.split("::ffff:")[1];
  const date = new Date();

  await Lgpd.create({
    ip_user: ip,
    browser: browserName + browserVersion,
    os_system: osName + osVersion,
  });

  res.cookie("token", generateToken({ ip, date }));
  res.status(200).json({ token: generateToken({ ip, date }) });
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  const username = `uid=${email}@inss.gov.br`;

  if (!email || !password) {
    return res.status(200).json({ error: "Preencha todos os campos" });
  }

  const [mail] = email.split(",", 1);
  const opts = {
    filter: `(uid=${mail})`,
    scope: "sub",
    attributes: ["cpf", "givenname", "mail"],
  };

  const client = ldap.createClient({
    url: "ldap://ldap.inss.gov.br",
  });

  client.bind(username, password, async (err) => {
    if (err) {
      return res.status(200).json({ error: "Usuário ou senha incorreto" });
    }

    let search = function () {
      const items = [];
      return new Promise((resolve, reject) => {
        client.search("ou=INSS,dc=gov,dc=br", opts, (err, res) => {
          if (err) {
            return res.status(200).json({ error: err });
          }
          res.on("searchEntry", async (entry) => {
            items.push(entry.object);
            var user = await User.findOne({ cpf: entry.object.cpf });
            if (!user) {
              await User.create({
                name: entry.object.givenName,
                email: entry.object.mail,
                cpf: entry.object.cpf,
              });
            }
            if (user) {
              items.push(entry.object, user.role);
            }
          });
          res.on("error", function (err) {
            console.error("error: " + err.message);
            reject(error);
          });
          res.on("end", function (result) {
            resolve(items);
          });
        });
      });
    };

    const userData = await search();

    const userRole = await User.findOne({ cpf: userData[0].cpf });

    const role = userRole ? userRole.role : "user";

    res.cookie("token", generateToken({ email }));
    res.status(200).json({
      name: userData[0].givenName,
      role: role,
      auth: true,
      email: mail,
      token: generateToken({ email: mail, role: role }),
    });
  });
});

module.exports = (app) => app.use("/auth", router);
