document.getElementById("add-form").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const formData = new FormData(this);
    const formObject = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formObject)
        });

        if (response.ok) {
            const result = await response.json();

            // Hide the form and display the response container
            document.getElementById("form-container").style.display = "none";
            document.getElementById("response-container").style.display = "block";

            // Display the response message
            document.getElementById("response-message").innerHTML = `
                <strong>Name:</strong> ${result.name} <br>
                <strong>City:</strong> ${result.city} <br>
                <strong>Country:</strong> ${result.country} <br>
                <strong>Birthday:</strong> ${result.birthday} <br>
                <strong>Email:</strong> ${result.email}
            `;

            // Notify the list page to reload the data
            window.localStorage.setItem("reloadList", "true"); // Set a flag in localStorage
        } else {
            console.error("Failed to add record:", response.status);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
    }
});
