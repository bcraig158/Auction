// Initialize the highest bid
let highestBid = 10000;

// Countdown Timer
const auctionEndTime = new Date("August 31, 2024 00:00:00 PST").getTime();

const countdownTimer = setInterval(() => {
    const now = new Date().getTime();
    const distance = auctionEndTime - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    if (distance < 0) {
        clearInterval(countdownTimer);
        document.getElementById("countdown").innerHTML = "Auction Ended";
    }
}, 1000);

// Function to format the date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = {
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    return date.toLocaleString('en-US', options);
}

// Function to save the bid data and update the highest bid
function saveBid(event) {
    const newBid = parseInt(event.bid);

    if (!event.bid || newBid <= highestBid) {
        return;
    }

    const bidData = {
        name: event.name,
        email: event.email,
        phone: event.phone,
        bid: newBid,
        timestamp: new Date().toISOString() // Use ISO format for consistency
    };

    fetch("https://sprouterbidapi.glitch.me/submit-bid", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bidData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error submitting bid.");
        }
        return response.json();
    })
    .then(data => {
        alert("Your bid has been saved successfully!");
        updateHighestBid(newBid);
        updateBiddingHistory();
    })
    .then(() => {
        document.getElementById("bid-form").reset();
        window.parent.postMessage({ type: "bidSubmitted" }, "*");
    })
    .catch(error => {
        console.error("Error:", error);
        alert("There was an error submitting your bid. Please try again later.");
    });
}

// Function to update the highest bid and notify the iframe
function updateHighestBid(newBid) {
    highestBid = newBid;
    document.getElementById("current-bid").innerText = `$${highestBid.toLocaleString()}`;
    updateIframeBidMin(highestBid + 1000);

    document.getElementById("bid").value = highestBid + 1000;
    document.getElementById("bid").min = highestBid + 1000;
}

// Function to update the iframe's minimum bid amount
function updateIframeBidMin(newMinBid) {
    const iframe = document.getElementById("bid-frame").contentWindow;
    iframe.postMessage({ minBid: newMinBid }, "https://bcraig158.github.io");
}

// Function to update the bidding history display
function updateBiddingHistory() {
    fetch("https://sprouterbidapi.glitch.me/retrieve-bids")
    .then(response => response.json())
    .then(bids => {
        let content = "";
        let highestBidFromServer = 0;

        if (bids.length === 0) {
            content = "<p>No bids available</p>";
        } else {
            bids.forEach(bid => {
                content += `
                    <div class="bid-entry">
                        <span class="bid-amount">Bid: $${bid.bid.toLocaleString()}</span>
                        <span class="bid-time">Time: ${formatDate(bid.timestamp)}</span>
                    </div>
                `;
                highestBidFromServer = Math.max(highestBidFromServer, bid.bid);
            });

            // Update the highest bid on the page
            updateHighestBid(highestBidFromServer);
        }

        if (document.getElementById("bids-text")) {
            document.getElementById("bids-text").innerHTML = content;
        }
    })
    .catch(error => {
        console.error("Error fetching bids:", error);
        document.getElementById("bids-text").innerHTML = "<p>Error loading bids.</p>";
    });
}
// Function to display the bidding history
function displayBiddingHistory(bids) {
    let content = "";
    let highestBidFromServer = 0;

    if (bids.length === 0) {
        content = "<p>No bids available</p>";
    } else {
        bids.forEach(bid => {
            content += `
                <div class="bid-entry">
                    <span class="bid-amount">Bid: $${bid.bid.toLocaleString()}</span>
                    <span class="bid-time">Time: ${formatDate(bid.timestamp)}</span>
                </div>
            `;
            highestBidFromServer = Math.max(highestBidFromServer, bid.bid);
        });

        // Update the highest bid on the page
        updateHighestBid(highestBidFromServer);
    }

    if (document.getElementById("bids-text")) {
        document.getElementById("bids-text").innerHTML = content;
    }
}

// Call updateBiddingHistory after ensuring DOM is fully loaded
window.addEventListener('load', function () {
    updateBiddingHistory();
});

// Set up the message listener to receive bid data from the iframe
window.addEventListener("message", function (event) {
    if (event.origin !== "https://bcraig158.github.io") {
        return;
    }

    if (event.data && event.data.bid && event.data.name && event.data.email && event.data.phone) {
        saveBid(event.data);
        updateBiddingHistory();
    }
}, false);

// Listener for scrolling to bidding history after bid submission
window.addEventListener("message", function(event) {
    if (event.data.type === "scrollToHistory") {
        document.querySelector('.bidding-history').scrollIntoView({ behavior: 'smooth' });
    }
    if (event.data.type === "bidSubmitted") {
        updateBiddingHistory();
    }
}, false);

// Reveal the full bid data only after correct PIN is entered
function revealData() {
    const pin = document.getElementById("admin-pin").value;
    const correctPin = "12345678";

    if (pin !== correctPin) {
        alert("Incorrect PIN. Access Denied.");
        return;
    }

    fetch("https://sprouterbidapi.glitch.me/retrieve-bids")
    .then(response => response.json())
    .then(bids => {
        let content = "";
        bids.forEach(bid => {
            content += `
                <div class="bid-entry">
                    <span class="bid-amount">Bid: $${bid.bid.toLocaleString()}</span>
                    <span class="bid-time">Time: ${new Date(bid.timestamp).toLocaleString('en-US', {
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    })}</span>
                    <div>Name: ${bid.name}</div>
                    <div>Email: ${bid.email}</div>
                    <div>Phone: ${bid.phone}</div>
                </div>
            `;
        });
        document.getElementById("bids-text").innerHTML = content;
    })
    .catch(error => {
        console.error("Error fetching bids:", error);
    });
}

// Initialize the current highest bid from existing data
function initializeHighestBid() {
    fetch("https://sprouterbidapi.glitch.me/retrieve-bids")
    .then(response => response.json())
    .then(bids => {
        if (bids.length > 0) {
            highestBid = Math.max(...bids.map(bid => bid.bid));
            document.getElementById("current-bid").innerText = `$${highestBid.toLocaleString()}`;
        }
        updateIframeBidMin(highestBid + 1000);
        updateBiddingHistory();
    })
    .catch(error => {
        console.error("Error initializing highest bid:", error);
    });
}

// Initialize the highest bid and bidding history when the page loads
initializeHighestBid();
