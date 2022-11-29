import path from 'node:path';
import logger from './logger.js';
import { writeFile } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateAnimeShowScore(labels, data) {
  const width = 1500;
  const height = 600;
  const backgroundColour = '#2e3035';
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
  const configuration = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          fill: true,
          backgroundColor: '#255a7c',
          borderColor: '#3eb4f0',
        },
      ],
    },
    options: {
      scales: {
        yAxis: {
          grace: 5,
          display: true,
          ticks: {
            color: 'white',
            padding: 10,
          },
        },
        xAxis: {
          display: true,
          ticks: {
            color: 'white',
            padding: 8,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `Airing Score`,
          color: 'white',
        },
      },
    },
  };
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  writeFile(path.join(__dirname, `../media/animeShowScore.png`), buffer, 'base64', genericCallback);
}

function genericCallback(err) {
  if (err) {
    logger.error(`[Chart] Error generating chart: ${err}`);
  } else {
    logger.info('[Chart] Chart Created');
  }
}
