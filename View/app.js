document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('summarize-form');
  const urlInput = document.getElementById('url');
  const summaryElement = document.getElementById('summary');
  const dateRefreshedElement = document.getElementById('date-refreshed');
  const internalUrlsTable = document.getElementById('internal-urls');
  const externalUrlsTable = document.getElementById('external-urls');
  const resultSection = document.getElementById('result-section');
  const refreshButton = document.getElementById('refresh-button');
  const spinner = document.createElement('div');

  spinner.id = 'loading-spinner';
  spinner.textContent = 'Loading...';
  spinner.style.display = 'none';
  spinner.style.textAlign = 'center';
  spinner.style.margin = '10px 0';
  form.parentElement.insertBefore(spinner, form.nextSibling);

  // Common function for fetching and updating the results
  async function fetchAndUpdateResults(url, forceRefresh, triggerButton) {
    if (!url) {
      alert('Please enter a URL.');
      resetState(triggerButton);
      return;
    }
    const startTime = performance.now(); // Start timer
    triggerButton.disabled = true; 
    spinner.style.display = 'block'; 
    try {
      const response = await fetch('/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, forceRefresh }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      
      const data = await response.json();
      const endTime = performance.now(); // End timer
      const timeTaken = endTime - startTime;
      console.log(`Data retrieved in ${timeTaken.toFixed(2)} ms`);

      updateResults(data.data);
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to ${forceRefresh ? 'refresh' : 'summarize'} the URL.`);
    } finally {
      resetState(triggerButton);
    }
  }

  // Handle form submission
  form.addEventListener('submit', async (event) => {
    
    event.preventDefault();
    const submitButton = form.querySelector('button');
    const url = urlInput.value.trim();
    await fetchAndUpdateResults(url, false, submitButton);
    console.log()
  });

  // Handle refresh button
  refreshButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    await fetchAndUpdateResults(url, true, refreshButton);
  });

  // Update results on the page
  function updateResults(data) {
    if (!data || !data.summary) {
      console.error('Invalid data received:', data);
      alert('Failed to update results. Please try again.');
      return;
    }
    resultSection.style.display = 'block';

    summaryElement.innerHTML = data.summary; // Use `innerHTML` since `summary` contains HTML
    dateRefreshedElement.textContent = data.dateRefreshed || 'Unknown';

    populateTable(internalUrlsTable, data.internalUrls || []);
    populateTable(externalUrlsTable, data.externalUrls || []);
  }

  // Populate tables with URLs
  function populateTable(table, urls) {
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }

    urls.forEach((url) => {
      const row = table.insertRow();
      const urlCell = row.insertCell(0);
      const actionCell = row.insertCell(1);

      urlCell.textContent = url;
      const button = document.createElement('button');
      button.textContent = 'Summarize';
      button.onclick = () => {
        urlInput.value = url;
        form.dispatchEvent(new Event('submit'));
      };
      actionCell.appendChild(button);
    });
  }

  function resetState(button) {
    if (button) button.disabled = false; 
    spinner.style.display = 'none';
  }
});
