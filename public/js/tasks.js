const username = "testuser";

function triggerVideoAd() {
    const adBox = document.getElementById('ad-wrapper');
    const launchBtn = document.getElementById('launch-ad-btn');
    const adInjectTarget = document.getElementById('ad-inject-target');
    
    if (!adBox || !launchBtn || !adInjectTarget) return;

    // 1. Clear any previous ad contents
    adInjectTarget.innerHTML = '';

    // 2. Disable the button and show loading state
    launchBtn.disabled = true;
    launchBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // 3. Show the ad wrapper
    adBox.classList.remove('hidden');

    // 4. Initialize backend validation session
    fetch('/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, taskName: "Video Ad" })
    })
    .then(res => res.json())
    .then(sessionData => {
        if (!sessionData.success) {
            launchBtn.disabled = false;
            launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            return alert("Session initialization failed.");
        }

        // 5. IFRAME SANDBOX WORKAROUND (Guarantees the ad script loads and renders correctly)
        const iframe = document.createElement('iframe');
        iframe.style.width = "100%";
        iframe.style.height = "250px"; // Adjust height based on your Adsterra ad format
        iframe.style.border = "none";
        iframe.style.overflow = "hidden";
        
        adInjectTarget.appendChild(iframe);

        // Inject the ad script inside the iframe's clean document window
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <html>
            <body style="margin:0; padding:0; display:flex; justify-content:center; align-items:center; background-color:transparent;">
                <script type="text/javascript" src="https://pl30335909.effectivecpmnetwork.com/08/6e/aa/086eaa61a28eb4deb7c779d111239e85.js"></script>
            </body>
            </html>
        `);
        iframeDoc.close();

        // 6. Start the Countdown Timer
        let timeLeft = 5;
        launchBtn.innerText = `Watching Ad (${timeLeft}s)...`;

        const countdown = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                launchBtn.innerText = `Watching Ad (${timeLeft}s)...`;
            } else {
                clearInterval(countdown);
                launchBtn.innerText = "Claiming reward...";

                // Claim reward using secure session id
                fetch('/api/reward', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: username, 
                        amount: 50, 
                        sessionId: sessionData.sessionId 
                    })
                })
                .then(res => res.json())
                .then(data => {
                    launchBtn.disabled = false;
                    launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    launchBtn.innerText = "Launch Ad";
                    
                    if (data.error) {
                        alert(data.error);
                    } else {
                        alert(`🎉 Success! Credited. Your balance is now: ${data.newBalance} Tokens.`);
                    }
                })
                .catch(err => console.error("Error securing reward stream:", err));
            }
        }, 1000);
    })
    .catch(err => {
        console.error("Error starting session:", err);
        launchBtn.disabled = false;
        launchBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        launchBtn.innerText = "Launch Ad";
    });
}