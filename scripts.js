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
        timestamp: new Date().toLocaleString()
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
        updateBiddingHistory();  // Update the bid history
    })
    .then(() => {
        // Clear the form fields
        document.getElementById("bid-form").reset();

        // Scroll to the bidding history section
        window.parent.postMessage({ type: "scrollToHistory" }, "*");
    })
    .catch(error => {
        console.error("Error:", error);
        alert("There was an error submitting your bid. Please try again later.");
    });
}

// Function to update the highest bid and notify the iframe
function updateHighestBid(newBid) {
    if (newBid > highestBid) {
        highestBid = newBid;
        document.getElementById("current-bid").innerText = highestBid;
        updateIframeBidMin(highestBid + 1000);

        document.getElementById("bid").value = highestBid + 1000;
        document.getElementById("bid").min = highestBid + 1000;

        // Ensure bid history is updated immediately
        updateBiddingHistory();
    }
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
        let content = "Bids:\n\n";
        bids.forEach(bid => {
            content += `Bid: $${bid.bid}\n`;
            content += `Time: ${bid.timestamp}\n\n`;
        });

        if (document.getElementById("bids-text")) {
            document.getElementById("bids-text").innerText = content;
        }
    })
    .catch(error => {
        console.error("Error fetching bids:", error);
    });
}

// Call updateBiddingHistory after ensuring DOM is fully loaded
window.addEventListener('load', function () {
    fetch("https://sprouterbidapi.glitch.me/retrieve-bids")
        .then(response => response.json())
        .then(data => {
            const highestBidFromServer = Math.max(...data.map(bid => bid.bid), 0);
            highestBid = highestBidFromServer;

            document.getElementById("bid").value = highestBid + 1000;
            document.getElementById("bid").min = highestBid + 1000;

            updateHighestBid(highestBid);
            updateBiddingHistory();
        })
        .catch(error => {
            console.error("Error fetching bids:", error);
        });
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
        let content = "Bids:\n\n";
        bids.forEach(bid => {
            content += `Bid: $${bid.bid}\n`;
            content += `Time: ${new Date(bid.timestamp).toLocaleString()}\n`;
            content += `Name: ${bid.name}\n`;
            content += `Email: ${bid.email}\n`;
            content += `Phone: ${bid.phone}\n\n`;
        });
        document.getElementById("bids-text").innerText = content;
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
            document.getElementById("current-bid").innerText = highestBid;
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

// Listener for scrolling to bidding history after bid submission
window.addEventListener("message", function(event) {
    if (event.data.type === "scrollToHistory") {
        document.querySelector('.bidding-history').scrollIntoView({ behavior: 'smooth' });
    }
}, false);
