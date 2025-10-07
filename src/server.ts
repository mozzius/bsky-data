import express, { Express } from "express";
import { DB } from "./db.js";

export function createServer(db: DB): Express {
  const app = express();

  app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Bluesky Data Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #1a1a1a;
      color: #fff;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
    }
    #chartContainer {
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      justify-content: center;
    }
    .stat-card {
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      min-width: 150px;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #60a5fa;
    }
    .stat-label {
      color: #9ca3af;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <h1>Bluesky AT Protocol Data Dashboard</h1>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value" id="postCount">-</div>
      <div class="stat-label">Posts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="threadgateCount">-</div>
      <div class="stat-label">Threadgates</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="postgateCount">-</div>
      <div class="stat-label">Postgates</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="threadgatePercentage">-</div>
      <div class="stat-label">% Top-Level Posts with Threadgate Rules</div>
    </div>
  </div>

  <div id="chartContainer">
    <canvas id="chart"></canvas>
  </div>

  <div id="chartContainer" style="margin-top: 30px;">
    <canvas id="percentageChart"></canvas>
  </div>

  <div id="chartContainer" style="margin-top: 30px;">
    <canvas id="rulesChart"></canvas>
  </div>

  <div id="chartContainer" style="margin-top: 30px;">
    <canvas id="rulesPerThreadGateChart"></canvas>
  </div>

  <div id="chartContainer" style="margin-top: 30px;">
    <canvas id="combinationsChart"></canvas>
  </div>

  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Posts',
            data: [],
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            tension: 0.4
          },
          {
            label: 'Threadgates',
            data: [],
            borderColor: '#34d399',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            tension: 0.4
          },
          {
            label: 'Postgates',
            data: [],
            borderColor: '#f87171',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 500
        },
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          },
          title: {
            display: true,
            text: 'Total Counts Over Time',
            color: '#fff',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            type: 'time',
            time: {
              unit: 'second',
              displayFormats: {
                second: 'HH:mm:ss'
              }
            },
            ticks: {
              color: '#9ca3af',
              maxTicksLimit: 10
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    const percentageCtx = document.getElementById('percentageChart').getContext('2d');
    const percentageChart = new Chart(percentageCtx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: '% of Top-Level Posts with Threadgate Rules',
            data: [],
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167, 139, 250, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 500
        },
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          },
          title: {
            display: true,
            text: 'Threadgate Rules Usage on Top-Level Posts',
            color: '#fff',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#9ca3af',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            type: 'time',
            time: {
              unit: 'second',
              displayFormats: {
                second: 'HH:mm:ss'
              }
            },
            ticks: {
              color: '#9ca3af',
              maxTicksLimit: 10
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    const rulesCtx = document.getElementById('rulesChart').getContext('2d');
    const rulesChart = new Chart(rulesCtx, {
      type: 'bar',
      data: {
        labels: ['Mention', 'Following', 'Follower', 'List', 'Hidden Posts Only'],
        datasets: [
          {
            label: 'Rule Usage Count',
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              'rgba(96, 165, 250, 0.7)',
              'rgba(52, 211, 153, 0.7)',
              'rgba(248, 113, 113, 0.7)',
              'rgba(251, 191, 36, 0.7)',
              'rgba(167, 139, 250, 0.7)'
            ],
            borderColor: [
              '#60a5fa',
              '#34d399',
              '#f87171',
              '#fbbf24',
              '#a78bfa'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 500
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Threadgate Rule Usage',
            color: '#fff',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    const rulesPerThreadGateCtx = document.getElementById('rulesPerThreadGateChart').getContext('2d');
    const rulesPerThreadGateChart = new Chart(rulesPerThreadGateCtx, {
      type: 'bar',
      data: {
        labels: ['0 Rules', '1 Rule', '2 Rules', '3 Rules', '4 Rules'],
        datasets: [
          {
            label: 'Number of Threadgates',
            data: [0, 0, 0, 0, 0],
            backgroundColor: 'rgba(167, 139, 250, 0.7)',
            borderColor: '#a78bfa',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 500
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Rules Per Threadgate Distribution',
            color: '#fff',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    const combinationsCtx = document.getElementById('combinationsChart').getContext('2d');
    const combinationsChart = new Chart(combinationsCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Number of Threadgates',
            data: [],
            backgroundColor: 'rgba(52, 211, 153, 0.7)',
            borderColor: '#34d399',
            borderWidth: 2
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 500
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 10 Rule Combinations',
            color: '#fff',
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    async function loadHistoricalData() {
      try {
        const response = await fetch('/api/historical?limit=20');
        const historical = await response.json();

        if (historical.length > 0) {
          // Populate charts with historical data
          historical.forEach((point, index) => {
            const timestamp = new Date(point.timestamp / 1000);

            chart.data.datasets[0].data.push({ x: timestamp, y: point.posts });
            chart.data.datasets[1].data.push({ x: timestamp, y: point.threadgates });
            chart.data.datasets[2].data.push({ x: timestamp, y: point.postgates });

            const threadgatePercentage = point.topLevelPosts > 0
              ? (point.topLevelPostsWithThreadGate / point.topLevelPosts) * 100
              : 0;

            percentageChart.data.datasets[0].data.push({ x: timestamp, y: threadgatePercentage });
          });

          chart.update();
          percentageChart.update();
        }
      } catch (error) {
        console.error('Failed to load historical data:', error);
      }
    }

    async function updateData() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        document.getElementById('postCount').textContent = data.posts.toLocaleString();
        document.getElementById('threadgateCount').textContent = data.threadgates.toLocaleString();
        document.getElementById('postgateCount').textContent = data.postgates.toLocaleString();
        document.getElementById('threadgatePercentage').textContent = data.threadgatePercentage.toFixed(2) + '%';

        const now = new Date();

        // Update first chart
        chart.data.datasets[0].data.push({ x: now, y: data.posts });
        chart.data.datasets[1].data.push({ x: now, y: data.threadgates });
        chart.data.datasets[2].data.push({ x: now, y: data.postgates });

        // Update percentage chart
        percentageChart.data.datasets[0].data.push({ x: now, y: data.threadgatePercentage });

        // Update rules chart
        rulesChart.data.datasets[0].data = [
          data.ruleStats.mentionRule || 0,
          data.ruleStats.followingRule || 0,
          data.ruleStats.followerRule || 0,
          data.ruleStats.listRule || 0,
          data.ruleStats.hiddenPostsOnly || 0
        ];

        // Update rules per threadgate chart
        rulesPerThreadGateChart.data.datasets[0].data = [
          data.rulesPerThreadGate.zero || 0,
          data.rulesPerThreadGate.one || 0,
          data.rulesPerThreadGate.two || 0,
          data.rulesPerThreadGate.three || 0,
          data.rulesPerThreadGate.four || 0
        ];

        // Update combinations chart
        combinationsChart.data.labels = data.topCombinations.map(c => c.combination);
        combinationsChart.data.datasets[0].data = data.topCombinations.map(c => c.count);

        // Keep only last 20 data points
        if (chart.data.datasets[0].data.length > 20) {
          chart.data.datasets[0].data.shift();
          chart.data.datasets[1].data.shift();
          chart.data.datasets[2].data.shift();
        }

        if (percentageChart.data.datasets[0].data.length > 20) {
          percentageChart.data.datasets[0].data.shift();
        }

        chart.update();
        percentageChart.update();
        rulesChart.update();
        rulesPerThreadGateChart.update();
        combinationsChart.update();
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }

    // Load historical data first, then start live updates
    loadHistoricalData().then(() => {
      updateData();
      setInterval(updateData, 2000);
    });
  </script>
</body>
</html>
    `);
  });

  app.get("/api/stats", (req, res) => {
    const topLevelPosts = db.getTopLevelPostCount();
    const topLevelPostsWithThreadGate = db.getTopLevelPostsWithThreadGateCount();
    const threadgatePercentage = topLevelPosts > 0
      ? (topLevelPostsWithThreadGate / topLevelPosts) * 100
      : 0;

    const threadgatesWithRules = db.getThreadGateWithRulesCount();
    const totalThreadgates = db.getThreadGateCount();
    const threadgateRulesPercentage = totalThreadgates > 0
      ? (threadgatesWithRules / totalThreadgates) * 100
      : 0;

    const ruleStats = db.getThreadGateRuleStats();
    const rulesPerThreadGate = db.getRulesPerThreadGateDistribution();
    const topCombinations = db.getTopRuleCombinations(10);

    res.json({
      posts: db.getPostCount(),
      threadgates: db.getThreadGateCount(),
      postgates: db.getPostGateCount(),
      topLevelPosts,
      topLevelPostsWithThreadGate,
      threadgatePercentage,
      threadgatesWithRules,
      threadgateRulesPercentage,
      ruleStats,
      rulesPerThreadGate,
      topCombinations,
    });
  });

  app.get("/api/historical", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const historical = db.getHistoricalStats(limit);
    res.json(historical);
  });

  return app;
}
