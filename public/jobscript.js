/// PASSWORD ///
window.onload = function() {
  const isAuthenticated = sessionStorage.getItem("authenticated");

  if (isAuthenticated !== "true") {
      window.location.href = "login.html"; // Redirect to the login page if not authenticated
  }
}

/// BUTTONS FOR NAV ///

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("web-background").style.width = "100%";
}
  
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("web-background").style.width = "0";
}

document.getElementById('newJob').addEventListener('click', function() 
{
// Show the dialog
    document.getElementById('newJobModal').style.display = "block";

    populateNewJobDropdowns();
})

function newJobClose() {
document.getElementById("newJobModal").style.display = 'none';
}

document.getElementById('adjustMat').addEventListener('click', function() {
    // Show the dialog
    document.getElementById('adjustMatModal').style.display = "block";

    populateAdjustMatDropdowns();

})

function adjustMatClose() {
document.getElementById("adjustMatModal").style.display = 'none';
}

document.getElementById('newMat').addEventListener('click', function() {
    // Show the dialog
    document.getElementById('newMatModal').style.display = "block";

    populateNewMatDropdowns();

})

function newMatClose() {
document.getElementById("newMatModal").style.display = 'none';
}

document.getElementById('closeOut').addEventListener('click', function() {
    // Show the dialog
    document.getElementById('closeOutModal').style.display = "block";

    populateCloseOutDropdown();

})

function closeOutClose() {
document.getElementById("closeOutModal").style.display = 'none';
}

updateJobsTable();


//-----------//
// JOBS PAGE //
//-----------//

function updateJobsTable() {
    const tableBody = document.getElementById('jobs-table-body');
  
    fetch('/api/jobs')
      .then(response => response.json())
      .then(data => {
        const jobsMap = new Map();
  
        data.forEach(item => {
          const { JobName, Category, SubType, amount, latestChange, date } = item;
  
          if (!jobsMap.has(JobName)) {
            jobsMap.set(JobName, {
              categories: [{ Category, subtypes: [{ SubType, amount, latestChange, date }] }]
            });
          } else {
            const jobData = jobsMap.get(JobName);
            const foundCategory = jobData.categories.find((categoryObject) => categoryObject.Category === Category);
            if (foundCategory) {
              foundCategory.subtypes.push({ SubType, amount, latestChange, date });
            } else {
              jobData.categories.push({ Category, subtypes: [{ SubType, amount, latestChange, date }] });
            }
          }
        });
  
        tableBody.innerHTML = '';
  
        jobsMap.forEach((jobData, JobName) => {
          let isFirstCategory = true;
  
          jobData.categories.forEach(categoryObject => {
            let isFirstSubtype = true;
  
            categoryObject.subtypes.forEach(subtypeObject => {
              const subtypeRow = document.createElement('tr');
  
              if (isFirstSubtype && isFirstCategory) {
                const jobNameCell = document.createElement('td');
                jobNameCell.textContent = JobName;
                jobNameCell.rowSpan = jobData.categories.reduce((acc, category) => acc + category.subtypes.length, 0);
                subtypeRow.appendChild(jobNameCell);
                isFirstCategory = false;
              }
  
              if (isFirstSubtype) {
                const categoryCell = document.createElement('td');
                categoryCell.textContent = categoryObject.Category;
                categoryCell.rowSpan = categoryObject.subtypes.length;
                subtypeRow.appendChild(categoryCell);
                isFirstSubtype = false;
              }
  
              const SubTypeCell = document.createElement('td');
              SubTypeCell.textContent = subtypeObject.SubType;
              subtypeRow.appendChild(SubTypeCell);
  
              const amountCell = document.createElement('td');
              amountCell.textContent = subtypeObject.amount;
              subtypeRow.appendChild(amountCell);
  
              const latestChangeCell = document.createElement('td');
              latestChangeCell.textContent = subtypeObject.latestChange;
              subtypeRow.appendChild(latestChangeCell);
  
              const dateCell = document.createElement('td');
              dateCell.textContent = subtypeObject.date;
              subtypeRow.appendChild(dateCell);
  
              // Add the SubType row to the table body
              tableBody.appendChild(subtypeRow);
            });
          });
        });
      })
      .catch(error => console.error('Error:', error));
  }

function populateNewJobDropdowns() 
{   
    // Fetch the categories from the server
    fetch('/api/categories')
        .then(response => {
          // If the response is not ok, log the response text to the console
          if (!response.ok) {
            response.text().then(text => {
              console.log('Response Text:', text);
            });
          }
          return response.json();
        })
        .then(data => {
            const categorySelect = document.getElementById('newJobcategory');
            const subTypeSelect = document.getElementById('newJobSubType');
  
            // Clear the dropdowns
            categorySelect.innerHTML = '';
            subTypeSelect.innerHTML = '';
  
            // Create a map of categories to subtypes
            const categories = new Map();
            data.forEach(row => {
                if (!categories.has(row.Category)) {
                    categories.set(row.Category, []);
                }
                categories.get(row.Category).push(row.SubType);
            });
  
            // Populate the category dropdown
            categories.forEach((subtypes, category) => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
  
            // Populate the subtype dropdown when a category is selected
            categorySelect.addEventListener('change', function() {
                const selectedCategory = this.value;
                const subtypes = categories.get(selectedCategory);
  
                subTypeSelect.innerHTML = '';
                subtypes.forEach(subtype => {
                    const option = document.createElement('option');
                    option.value = subtype;
                    option.textContent = subtype;
                    subTypeSelect.appendChild(option);
                });
            });
  
            // Trigger the change event to populate the subtype dropdown with the initial category's subtypes
            categorySelect.dispatchEvent(new Event('change'));
        })
        .catch(error => console.error('Error:', error));
}

function populateAdjustMatDropdowns() {
    // Fetch the jobs from the server
    fetch('/api/jobs')
      .then(response => {
        // If the response is not ok, log the response text to the console
        if (!response.ok) {
          response.text().then(text => {
            console.log('Response Text:', text);
          });
        }
        return response.json();
      })
      .then(data => {
        const jobSelect = document.getElementById('adjustMatJob');
        const categorySelect = document.getElementById('adjustMatCategory');
        const subTypeSelect = document.getElementById('adjustMatSubType');
  
        // Clear the dropdowns
        jobSelect.innerHTML = '';
        categorySelect.innerHTML = '';
        subTypeSelect.innerHTML = '';
  
        // Create a map of jobs to categories and subtypes
        const jobs = new Map();
        data.forEach(row => {
          const { JobName, Category, SubType } = row;
          if (!jobs.has(JobName)) {
            jobs.set(JobName, { categories: new Map() });
          }
          if (!jobs.get(JobName).categories.has(Category)) {
            jobs.get(JobName).categories.set(Category, []);
          }
          jobs.get(JobName).categories.get(Category).push(SubType);
        });
  
        // Populate the job dropdown
        jobs.forEach((jobData, jobName) => {
          const option = document.createElement('option');
          option.value = jobName;
          option.textContent = jobName;
          jobSelect.appendChild(option);
        });
  
        // Populate the category dropdown based on the selected job
        jobSelect.addEventListener('change', function () {
          const selectedJob = this.value;
          const categories = jobs.get(selectedJob).categories;
  
          categorySelect.innerHTML = '';
          subTypeSelect.innerHTML = '';
  
          categories.forEach((subtypes, category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
          });
  
          // Trigger the change event to populate the subtype dropdown with the initial category's subtypes
          categorySelect.dispatchEvent(new Event('change'));
        });
  
        // Populate the subtype dropdown when a category is selected
        categorySelect.addEventListener('change', function () {
          const selectedJob = jobSelect.value;
          const selectedCategory = this.value;
          const subtypes = jobs.get(selectedJob).categories.get(selectedCategory);
  
          subTypeSelect.innerHTML = '';
          subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype;
            option.textContent = subtype;
            subTypeSelect.appendChild(option);
          });
        });
  
        // Trigger the change event to populate the category and subtype dropdowns with the initial job's categories and subtypes
        jobSelect.dispatchEvent(new Event('change'));
      })
      .catch(error => console.error('Error:', error));
  }

function populateNewMatDropdowns() {
    // Fetch the jobs from the server
    fetch('/api/jobs')
    .then(response => {
        if (!response.ok) {
        response.text().then(text => {
            console.log('Response Text:', text);
        });
        }
        return response.json();
    })
    .then(data => {
        const jobSelect = document.getElementById('newMatJob');

        // Clear the dropdown
        jobSelect.innerHTML = '';

        // Use a Set to eliminate duplicates
        const uniqueJobNames = new Set();

        // Populate the job dropdown
        data.forEach(job => {
        uniqueJobNames.add(job.JobName);
        });

        uniqueJobNames.forEach(jobName => {
        const option = document.createElement('option');
        option.value = jobName;
        option.textContent = jobName;
        jobSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error:', error));
  
    // Fetch the categories from the server
    fetch('/api/categories')
      .then(response => {
        if (!response.ok) {
          response.text().then(text => {
            console.log('Response Text:', text);
          });
        }
        return response.json();
      })
      .then(data => {
        const categorySelect = document.getElementById('newMatCategory');
        const subTypeSelect = document.getElementById('newMatSubType');
  
        // Clear the dropdowns
        categorySelect.innerHTML = '';
        subTypeSelect.innerHTML = '';
  
        // Create a map of categories to subtypes
        const categories = new Map();
        data.forEach(row => {
          if (!categories.has(row.Category)) {
            categories.set(row.Category, []);
          }
          categories.get(row.Category).push(row.SubType);
        });
  
        // Populate the category dropdown
        categories.forEach((subtypes, category) => {
          const option = document.createElement('option');
          option.value = category;
          option.textContent = category;
          categorySelect.appendChild(option);
        });
  
        // Populate the subtype dropdown when a category is selected
        categorySelect.addEventListener('change', function () {
          const selectedCategory = this.value;
          const subtypes = categories.get(selectedCategory);
  
          subTypeSelect.innerHTML = '';
          subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype;
            option.textContent = subtype;
            subTypeSelect.appendChild(option);
          });
        });
  
        // Trigger the change event to populate the subtype dropdown with the initial category's subtypes
        categorySelect.dispatchEvent(new Event('change'));
      })
      .catch(error => console.error('Error:', error));
  }

function populateCloseOutDropdown()
{
    fetch('/api/jobs')
    .then(response => {
        if (!response.ok) {
        response.text().then(text => {
            console.log('Response Text:', text);
        });
        }
        return response.json();
    })
    .then(data => {
        const jobSelect = document.getElementById('closeOutJob');

        // Clear the dropdown
        jobSelect.innerHTML = '';

        // Use a Set to eliminate duplicates
        const uniqueJobNames = new Set();

        // Populate the job dropdown
        data.forEach(job => {
        uniqueJobNames.add(job.JobName);
        });

        uniqueJobNames.forEach(jobName => {
        const option = document.createElement('option');
        option.value = jobName;
        option.textContent = jobName;
        jobSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error:', error));
}

function processNewJobForm(input)
{
  const client = input.elements.clientName.value;
  const jobCat = input.elements.newJobcategory.value;
  const jobSub = input.elements.newJobSubType.value;
  const initialAmount = input.elements.amountOf.value;
  const change = "+" + initialAmount;

  let date = new Date();
  var currentTime = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' });

  fetch('/api/jobs',
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client, jobCat, jobSub, initialAmount, change, currentTime})
  }).then(response => 
    {
      if(!response.ok)
      {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.text();
    }).then(result =>
      {
        console.log(result);

        updateJobsTable();

        newJobClose();
      }).catch(error =>
        {
          console.error('Error', error);
        })
}

function processAdjustMatForm(input)
{
  const client = input.elements.adjustMatJob.value;
  const jobCat = input.elements.adjustMatCategory.value;
  const jobSub = input.elements.adjustMatSubType.value;
  const amountSelect = Number(input.elements.amountOf.value);
  const addOrRemove = input.elements.ChangeInv.value;

  const adjustment = addOrRemove === 'Add' ? amountSelect : -amountSelect;
  
  var change = addOrRemove === 'Add' ? "+" : "-";

  change = change + amountSelect;

  let date = new Date();
  var currentTime = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' });

  fetch('/api/jobs', {
    method: 'PUT',
    headers: 
    {'Content-Type': 'application/json'},
    body: JSON.stringify({client, jobCat, jobSub, adjustment, change, currentTime}),
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.text();
  })
  .then(result => {
    console.log(result);
    updateJobsTable();
    adjustMatClose();
  }).catch(error => console.error('Error:', error));
}

function processNewMatForm(input)
{
  const client = input.elements.newMatJob.value;
  const jobCat = input.elements.newMatCategory.value;
  const jobSub = input.elements.newMatSubType.value;
  const initialAmount = Number(input.elements.amountOf.value);
  const change = "+" + initialAmount;

  let date = new Date();
  var currentTime = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' });

  fetch('/api/jobs/newMat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client, jobCat, jobSub, initialAmount, change, currentTime}),
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.text();
  })
  .then(result => {
    console.log(result);
    updateJobsTable();
    newMatClose();
  }).catch(error => console.error('Error:', error));
}

function processCloseOutForm(input)
{
  const client = input.elements.closeOutJob.value;

  fetch('/api/jobs/close', 
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client})
  }).then(response =>
    {
      if(!response.ok)
      {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.text();
    }).then(result =>
      {
        console.log(result);
        updateJobsTable();
        closeOutClose();
      }).catch(error =>
        {
          console.log('Error:', error);
        })
}