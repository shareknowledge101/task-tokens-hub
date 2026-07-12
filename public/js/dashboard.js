const username = "testuser"; // Simulated persistent local session string

document.addEventListener("DOMContentLoaded", () => {
    const balanceDisplay = document.getElementById('balance-display');
    if (balanceDisplay) {
        fetch(`/api/user/${username}`)
            .then(res => res.json())
            .then(data => {
                balanceDisplay.innerText = `${data.tokens} Tokens`;
            })
            .catch(err => console.error("Error fetching balance data:", err));
    }
});