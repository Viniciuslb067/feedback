const express = require("express");
const authMiddleware = require("../middlewares/auth");
const ensureAuthMiddleware = require("../middlewares/ensureAuth");

const System = require("../models/System");

const router = express.Router();

//Listar todos os sistemas
router.get("/list", authMiddleware, async (req, res) => {
    try {
        const systems = await System.find();
        const totalSystems = await System.countDocuments();
        return res.json({systems, totalSystems});
    } catch (err) {
        return res.status(400).send({ error: "Erro ao listar os sistemas" });
    }
});
//Listar um sistema
router.get("/:systemId", ensureAuthMiddleware, async (req, res) => {
    try {
        const system = await System.findById(req.params.systemId);
        return res.json(system);
    } catch (err) {
        return res.status(400).send({ error: "Erro ao exibir um sistema" });
    }
});
//Cadastrar um sistema
router.post("/", ensureAuthMiddleware, async (req, res) => {
    try {
        const { name, dns, area } = req.body;

        if (!dns || !name || !area) {
            return res.status(200).json({ error: "Preencha todos os campos!" })
        }

        if (await System.findOne({ dns: dns, name: name })) {
            return res.status(200).json({ error: "Sistema já cadastrado!" });
        } else {
            await System.create(req.body);

            return res.status(200).json({ success: "Sistema cadastrado com sucesso!" })
        }

    } catch (err) {
        return res.status(400).send({ error: "Erro ao cadastrar o sistema" });
    }
});
//Editar um sistema
router.put("/update/:systemId", ensureAuthMiddleware, async (req, res) => {
    try {
        const { dns, name, area } = req.body;

        if (!dns || !name || !area) {
            return res.status(200).send({ error: "Preencha todos os campos" });
        }

        const systemUpdate = await System.findByIdAndUpdate(req.params.systemId, req.body, { new: true });
        
        return res.status(200).json({ success: "Sistema atualizado com sucesso", system: systemUpdate });

    } catch (err) {
        return res.status(400).send({ error: "Erro ao atualizar o sistema" });
    }
});
//Deletar um sistema
router.delete("/delete/:systemId", ensureAuthMiddleware, async (req, res) => {
    try {
        await System.findByIdAndRemove(req.params.systemId);
        return res.status(200).json({ success: "Sistema excluido com sucesso" });
    } catch (err) {
        return res.status(400).send({ error: "Erro ao excluir um sistema" }) 
    }
});

module.exports = (app) => app.use("/system", router);
