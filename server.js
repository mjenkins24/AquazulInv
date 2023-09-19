const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
let inventoryData = require('./InventoryData');
let jobsData = require('./JobsData');
const app = express();
app.use(express.json());
const port = 5500;
app.use(express.static('public'));

// const PASSWORD = 'AquazCCSJ1994';

// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(session({
//     secret: 'someRandomSecret',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { maxAge: 60000 * 30 } // session will last for 30 minutes
// }));

// // Middleware to check authentication
// app.use((req, res, next) => {
//     if (req.path === '/login' || req.session.authenticated) {
//         return next();
//     }
//     res.redirect('/login'); // if not authenticated, redirect to login
// });

// app.get('/login', (req, res) => {
//     // Serve your login page
//     res.sendFile(__dirname + '/login.html');
// });

// app.post('/login', (req, res) => {
//     if (req.body.password === PASSWORD) {
//         req.session.authenticated = true;
//         return res.redirect('/'); // redirect to the main page
//     }
//     res.status(401).send('Wrong password'); // or redirect to the login page with an error message
// });

// app.get('/', (req, res) => {
//     // Serve the main content for authenticated users
//     res.send('Welcome to the main page!');
// });

// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('database.db', (err) => {
//   if (err) {
//     console.error('Error connecting to database:', err.message);
//   } else {
//     console.log('Connected to the SQLite database.');
//   }
// });



//INVENTORY DATABASE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      Category TEXT NOT NULL,
      SubType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      total INTEGER NOT NULL,
      diff INTEGER NOT NULL,
      latestChange TEXT,
      date TEXT,
      UNIQUE(Category, SubType)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Table "inventory" created or already exists.');
    }

    // Fetch all existing data from the database
    db.all('SELECT * FROM inventory', (err, rows) => {
      if (err) {
        console.error('Error querying data:', err.message);
      } else {
        // Convert existing data to a Set to facilitate comparison
        const existingData = new Set(rows.map((row) => `${row.Category}-${row.SubType}`));

        // Insert only the new data (that doesn't already exist) into the database
        insertData(inventoryData.filter((item) => !existingData.has(`${item.Category}-${item.SubType}`)));
      }
    });
  });
});

//JOBS DATABASE /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      JobName TEXT NOT NULL,
      Category TEXT NOT NULL,
      SubType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      latestChange TEXT,
      date TEXT,
      UNIQUE(JobName, Category, SubType)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating jobs table:', err.message);
    } else {
      console.log('Table "jobs" created or already exists.');

      // Fetch all existing data from the jobs database
      db.all('SELECT * FROM jobs', (err, rows) => {
        if (err) {
          console.error('Error querying data:', err.message);
        } else {
          // Convert existing data to a Set to facilitate comparison
          const existingData = new Set(rows.map((row) => `${row.JobName}-${row.Category}-${row.SubType}`));
          console.log(jobsData);
          insertJobsData(jobsData);
        }
      });
    }
  });
});

//INSERT DATA INTO DATABASE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const insertData = (inventoryData) => {
  let totalRowsInserted = 0;
  const uniqueSubtypes = new Map();

  inventoryData.forEach((categoryObject) => {
    const category = categoryObject.Category;
    categoryObject.subtypes.forEach((subTypeObject) => {
      const subType = subTypeObject.SubType;
      const rowKey = `${category}-${subType}`;
      if (!uniqueSubtypes.has(rowKey)) {
        db.run(
          `
          INSERT OR IGNORE INTO inventory (Category, SubType, amount, total, diff, latestChange, date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            category,
            subType,
            subTypeObject.amount,
            subTypeObject.total,
            subTypeObject.diff,
            subTypeObject.latestChange,
            subTypeObject.date,
          ],
          (err) => {
            if (err) {
              console.error('Error inserting data:', err.message);
            } else {
              totalRowsInserted++;
              uniqueSubtypes.set(rowKey, true);
              console.log('Data inserted into the database.');
            }
          }
        );
      }
    });
  });

  console.log('Total rows inserted:', totalRowsInserted);
};

const insertJobsData = (jobsData) => {
  jobsData.forEach((jobObject) => {
    const jobName = jobObject.jobName;
    jobObject.categories.forEach((categoryObject) => {
      const category = categoryObject.category;
      categoryObject.subTypes.forEach((subTypeObject) => {
        const subType = subTypeObject.name;
        db.run(
          `INSERT OR IGNORE INTO jobs (JobName, Category, SubType, amount, latestChange, date)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            jobName,
            category,
            subType,
            subTypeObject.amount,
            subTypeObject.latestChange,
            subTypeObject.date,
          ],
          (err) => {
            if (err) {
              console.error('Error inserting data:', err.message);
            } else {
              console.log('Data inserted into the jobs database.');
            }
          }
        );
      });
    });
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/api/jobs', (req, res) => {
  db.all('SELECT * FROM jobs ORDER BY JobName ASC, Category ASC', (err, rows) => {
    if (err) {
      console.error('Error querying data:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/inventory', (req, res) => {
  db.all('SELECT * FROM inventory ORDER BY Category ASC', (err, rows) => {
    if (err) {
      console.error('Error querying data:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT Category, SubType FROM inventory ORDER BY Category ASC', (err, rows) => {
    if (err) {
      console.error('Error querying data:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(rows);
    }
  });
});

app.put('/api/inventory', (req, res) => {
  // Extract the data from the request body
  const { categorySelect, subtypeSelect, adjustment, change, currentTime } = req.body;
  console.log(req.body);
  // Update the database
  const query = `
    UPDATE inventory
    SET Amount = Amount + ?,
    latestChange = ?,
    date = ?
    WHERE Category = ? AND SubType = ?
  `;
  db.run(query, [adjustment, change, currentTime, categorySelect, subtypeSelect], (err) => {
    if (err) {
      console.error('Error updating data:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('Success');
    }
  });
});

app.post('/api/inventory', (req, res) => {
  // Extract the data from the request body
  console.log(req.body);
  const { categorySelect, newSubType, initialAmount, change, currentTime } = req.body;

  // Insert a new record into the inventory
  const query = `
    INSERT INTO inventory (Category, SubType, amount, total, diff, latestChange, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [categorySelect, newSubType, initialAmount, 0, 0, change, currentTime], (err) => {
    if (err) {
      console.error('Error inserting data:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('Success');
    }
  });
});

app.post('/api/jobs', (req, res) =>
{
  console.log(req.body);
  const {client, jobCat, jobSub, initialAmount, change, currentTime} = req.body;

  const query =
  `INSERT INTO jobs (JobName, Category, SubType, amount, latestChange, date)
  VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [client, jobCat, jobSub, initialAmount, change, currentTime], (err) =>
  {
    if (err)
    {
      console.error('Error inserting data:', err.message);
      res.status(500).send('Internal Server Error');
    } else
    {
      res.status(200).send('Success');
    }
  });
});

app.put('/api/jobs', (req, res) => {
  // Extract the data from the request body
  const {client, jobCat, jobSub, adjustment, change, currentTime} = req.body;
  console.log(req.body);
  // Update the database
  const query = `
    UPDATE jobs
    SET Amount = Amount + ?,
    latestChange = ?,
    date = ?
    WHERE JobName = ? AND Category = ? AND SubType = ?
  `;
  db.run(query, [adjustment, change, currentTime, client, jobCat, jobSub], (err) => {
    if (err) {
      console.error('Error updating data:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('Success');
    }
  });
});

app.post('/api/jobs/newMat', (req, res) => {
  const { client, jobCat, jobSub, initialAmount, change, currentTime } = req.body;

  // First, check if this specific material is already associated with the job
  const checkQuery = `
      SELECT * FROM jobs 
      WHERE JobName = ? AND Category = ? AND SubType = ?
  `;

  db.get(checkQuery, [client, jobCat, jobSub], (err, row) => {
      if (err) {
          console.error('Error querying data:', err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // If no such material exists for the job, insert
      if (!row) {
          const insertQuery = `
              INSERT INTO jobs (JobName, Category, SubType, amount, latestChange, date)
              VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.run(insertQuery, [client, jobCat, jobSub, initialAmount, change, currentTime], (err) => {
              if (err) {
                  console.error('Error inserting data:', err.message);
                  res.status(500).send('Internal Server Error');
              } else {
                  res.status(200).send('New material added successfully.');
              }
          });
      } else {
          // Material already exists for this job
          res.status(200).send('Material already exists for the job.');
      }
  });
});

app.delete('/api/jobs/close', (req, res) =>
{
  const {client} = req.body;

  const query = 
  `DELETE FROM jobs
  WHERE JobName = ?`;

  db.run(query, [client], (err) =>
  {
    if (err)
    {
      console.log('Error deleting data:', err.message);
      res.status(500).send('Internal Server Error');
    } else
    {
      res.status(200).send('Job Closed Successfully');
    }
  });
});

app.get('/api/jobs/summary', (req, res) => {
  // Define a query to aggregate totals for each Category and SubType across all jobs
  const query = `
    SELECT Category, SubType, SUM(Amount) as TotalAmount
    FROM jobs
    GROUP BY Category, SubType
  `;

  // Execute the query
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching job summary:', err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).json(rows);  // Return the summarized data as JSON
    }
  });
});

const getAllInventoryData = (callback) => {
  db.all('SELECT * FROM inventory ORDER BY Category', (err, rows) => {
    if (err) {
      console.error('Error querying data:', err.message);
      callback([]);
    } else {
      callback(rows);
    }
  });
};


// Call the function to fetch all inventory data from the database
getAllInventoryData((data) => {
  console.log('Data from the database:');
  console.log(data);
});

//JOBS //

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
