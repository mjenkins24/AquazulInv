// PASSWORD //

window.onload = function() {
  const isAuthenticated = sessionStorage.getItem("authenticated");

  if (isAuthenticated !== "true") {
      window.location.href = "login.html"; // Redirect to the login page if not authenticated
  }
}

// BUTTONS FOR NAV //

function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("web-background").style.width = "100%";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("web-background").style.width = "0";
}

//////////////////////// BUTTONS FOR INVENTORY //////////////////////////


document.getElementById('adjustButton').addEventListener('click', function() {
  // Show the dialog
  document.getElementById('adjustModal').style.display = "block";

  // Fetch the data and populate the dropdowns
  populateAdjustDropdowns();
})

function adjustClose() {
  document.getElementById("adjustModal").style.display = 'none';
}


///////////////////////////////////////////////////////////////


document.getElementById('SubTypeButton').addEventListener('click', function() {
  // Show the dialog
  document.getElementById('SubTypeModal').style.display = "block";

  // Fetch the data and populate the dropdowns
  populateSubTypeDropdowns();
});

function SubTypeClose() {
  document.getElementById("SubTypeModal").style.display = 'none';
}

document.getElementById('CategoryButton').addEventListener('click', function() {
  // Show the dialog
  document.getElementById('CategoryModal').style.display = "block";

});

function CategoryClose()
{
  document.getElementById("CategoryModal").style.display = 'none';
}


// Update the table when the page loads
updateInventoryTable();

// INVENTORY PAGE //

function updateInventoryTable() {
  const tableBody = document.getElementById('table-body');

  fetch('/api/jobs/summary')
      .then(response => response.json())
      .then(jobSummary => {
          return fetch('/api/inventory')
              .then(response => response.json())
              .then(inventoryData => {
                  inventoryData.forEach(item => {
                      const matchingJob = jobSummary.find(job => job.Category === item.Category && job.SubType === item.SubType);
                      if (matchingJob) {
                          item.total = matchingJob.TotalAmount;
                          item.diff = item.amount - item.total;
                      } else {
                          item.total = 0;  // No corresponding job, hence needed amount is 0
                          item.diff = item.amount;
                      }
                  });

                  return inventoryData;
              });
      })
      .then(data => {
          // Use a map to organize data by Categories, as before
          const categoriesMap = new Map();

          data.forEach(item => {
              const { Category, SubType, amount, total, diff, latestChange, date } = item;
              if (!categoriesMap.has(Category)) {
                  categoriesMap.set(Category, {
                      subtypes: [{ SubType, amount, total, diff, latestChange, date }]
                  });
              } else {
                  const categoryData = categoriesMap.get(Category);
                  categoryData.subtypes.push({ SubType, amount, total, diff, latestChange, date });
              }
          });

          // Clear the table first
          tableBody.innerHTML = '';

          // Now, generate the table rows based on the categoriesMap
          categoriesMap.forEach((categoryData, Category) => {
              let isFirstSubtype = true;

              categoryData.subtypes.forEach(subtypeObject => {
                  const subtypeRow = document.createElement('tr');
                  if (isFirstSubtype) {
                      const categoryCell = document.createElement('td');
                      categoryCell.textContent = Category;
                      categoryCell.rowSpan = categoryData.subtypes.length;
                      subtypeRow.appendChild(categoryCell);
                      isFirstSubtype = false;
                  }

                  subtypeRow.innerHTML += `
                      <td>${subtypeObject.SubType}</td>
                      <td>${subtypeObject.amount}</td>
                      <td>${subtypeObject.total}</td>
                      <td>${subtypeObject.diff}</td>
                      <td>${subtypeObject.latestChange}</td>
                      <td>${subtypeObject.date}</td>
                  `;

                  tableBody.appendChild(subtypeRow);
              });
          });
      })
      .catch(error => console.error('Error:', error));
}

//-------------------------------//
// DROP DOWN BARS FOR ADD/REMOVE //
//-------------------------------//

function populateAdjustDropdowns() {
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
          const categorySelect = document.getElementById('adjustcategory');
          const subTypeSelect = document.getElementById('subType');

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

function processAdjustForm(input)
{
  const categorySelect = input.elements.adjustcategory.value;
  const subtypeSelect = input.elements.subType.value;
  const amountSelect = Number(input.elements.amountOf.value);
  const addOrRemove = input.elements.ChangeInv.value;

  const adjustment = addOrRemove === 'Add' ? amountSelect : -amountSelect;
  
  var change = addOrRemove === 'Add' ? "+" : "-";

  change = change + amountSelect;

  let date = new Date();
  var currentTime = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' });

  fetch('/api/inventory', {
    method: 'PUT',
    headers: 
    {'Content-Type': 'application/json'},
    body: JSON.stringify({categorySelect, subtypeSelect, adjustment, change, currentTime}),
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.text();
  })
  .then(result => {
    console.log(result);
    updateInventoryTable();
    adjustClose();
  }).catch(error => console.error('Error:', error));

}


function populateSubTypeDropdowns() {
  fetch('/api/categories').then(response => {
    if(!response.ok)
    {
      response.text().then(text => {console.log('Response text:', text);});
    }

    return response.json();

  }).then(data => {
    const categorySelect = document.getElementById('newSubcategory');

    categorySelect.innerHTML = '';

    const categories = new Set();

    data.forEach(row => { categories.add(row.Category);});

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }).catch(error => console.error('Error:', error));
}

function processNewSubForm(input)
{
  const categorySelect = input.elements.newSubcategory.value;
  const newSubType = input.elements.NewSubType.value;
  const initialAmount = Number(input.elements.amountOf.value);
  var change = "+" + initialAmount;

  let date = new Date();
  var currentTime = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' });

  fetch('/api/inventory', 
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ categorySelect, newSubType, initialAmount, change, currentTime })
  }).then( response => 
    {
      if (!response.ok)
      {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.text();

    }).then(result => 
      {
        console.log(result);

        updateInventoryTable();

        SubTypeClose();
      }).catch(error =>
        {
          console.error('Error:', error);
        });
}


function processNewCatForm(input)
{
  const categorySelect = input.elements.NewCategory.value;
  const newSubType = input.elements.InitialSub.value;
  const initialAmount = Number(input.elements.amountOf.value);
  const change = "+" + initialAmount;

  let date = new Date();
  var currentTime = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' });

  fetch('/api/inventory',
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({categorySelect, newSubType, initialAmount, change, currentTime})
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

        updateInventoryTable();

        CategoryClose();
      }).catch(error =>
        {
          console.error('Error', error);
        });
}
