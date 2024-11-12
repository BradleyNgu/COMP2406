async function loadAnalysisData() {
    try {
        const response = await fetch("/analyze");
        if (response.ok) {
            const data = await response.json();

            // Display the count of records
            document.getElementById("record-count").innerText += data.count;

            // Display the list of records with all fields
            const recordList = document.getElementById("record-list");
            data.records.forEach(record => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>Name:</strong> ${record.name} <br>
                    <strong>City:</strong> ${record.city} <br>
                    <strong>Country:</strong> ${record.country} <br>
                    <strong>Birthday:</strong> ${record.birthday} <br>
                    <strong>Email:</strong> ${record.email} <br>
                    <hr>
                `;
                recordList.appendChild(listItem);
            });
        } else {
            console.error("Failed to load analysis data:", response.status);
        }
    } catch (error) {
        console.error("Error fetching analysis data:", error);
    }
}

loadAnalysisData();
