import Head from "next/head";
import { useContext } from "react";
import { CardMetrics } from "../../components/CardMetrics";
import {
  BarChart,
  PieChart,
} from "../../components/ChartMetrics";
import { GetServerSideProps } from "next";
import { SidebarContext } from "../../contexts/SidebarContext";
import { format, parseISO } from "date-fns";
import { parseCookies } from "nookies";
import ptBR from "date-fns/locale/pt-BR";

import { getAPIClient } from "../../services/axios";
import styles from "./assessment.module.scss";

interface Comments {
  ip_user: string;
  createdAt: string;
  note: number;
  comments: string;
  browser: string;
  system: string;
}

interface Assessment {
  id: string;
  question: string;
  requester: string;
  system: string;
  totalEntries: number;
  startDate: string;
  endDate: string;
  getStatus: string;
  notes: [];
  status: [];
  media: number;
  comments: Comments[];
  commentsTotal: number;
}

interface AssessmentProps {
  allData: Assessment;
}

export default function MetricsAssessment({ allData }: AssessmentProps) {
  const { isOpen } = useContext(SidebarContext);

  return (
    <>
      <Head>
        <title>Feedback | Dashboard</title>
      </Head>

      <main
        className={isOpen ? styles.mainContainer : styles.mainContainerHide}
      >
        <div className={styles.pageHeader}>
          <div>
            <h1>Dashboard</h1>
            <small>Avaliação feita pela {allData.requester}</small>
          </div>
        </div>

        <CardMetrics
          totalEntries={allData.totalEntries}
          question={allData.question}
          system={allData.system}
          status={allData.status}
          media={allData.media}
          endDate={allData.commentsTotal}
        />

        <div className={styles.grid}>
          <BarChart notes={allData.notes} />
          <PieChart status={allData.status} />
        </div>

        <div className={styles.table}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Comentários</h3>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.tableResponsive}>
                <table width="100%">
                  <thead>
                    <tr>
                      <td>IP</td>
                      <td>Comentário</td>
                      <td>Data</td>
                      <td>Nota</td>
                      <td>Navegador</td>
                      <td>Sistema</td>
                    </tr>
                  </thead>
                  <tbody>
                    {allData.comments.map((item, key) => {
                      return (
                        <tr key={key}>
                          <td>{item.ip_user.split("::ffff:")}</td>
                          <td>{item.comments}</td>
                          <td>
                            {format(
                              parseISO(item.createdAt),
                              "dd/MM/yy 'às' HH:mm"
                            )}
                          </td>
                          <td>{item.note} Estrelas</td>
                          <td>{item.browser}</td>
                          <td>{item.system}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { slug } = ctx.params;
  const apiClient = getAPIClient(ctx);
  const { ["feedback.token"]: token } = parseCookies(ctx);

  if (!token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const { data } = await apiClient.get(`/assess/result/${slug}`);
  const entries = await apiClient.get(
    `/entry/entries/${data.infoAssessment.system}`
  );

  const allData = {
    id: data.infoAssessment._id,
    question: data.infoAssessment.question,
    requester: data.infoAssessment.requester,
    system: data.infoAssessment.system,
    totalEntries: entries.data.totalEntries,
    getStatus: data.infoAssessment.status,
    startDate: format(parseISO(data.infoAssessment.start_date), "d MMMM yyyy", {
      locale: ptBR,
    }),
    endDate: format(parseISO(data.infoAssessment.end_date), "d MMMM yyyy", {
      locale: ptBR,
    }),
    notes: data.notes,
    status: data.submissions,
    media: data.mediaFormatted,
    comments: data.comments,
    commentsTotal: data.totalComments,
  };

  return {
    props: {
      allData,
    },
  };
};
