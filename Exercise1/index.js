const express = require('express');
const app = express();
const port = 4444;
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:name', (req, res) => {
    const name = req.params.name;
    const userNumber = parseInt(req.query.number, 10); // Convert to integer
    const randomNumber = Math.floor(Math.random() * 10) + 1; // Generate a random number between 1 and 10

    // Check if userNumber is valid
    let message = ``;
    if (isNaN(userNumber) || userNumber < 1 || userNumber > 10) {
        message +=(`Hello ${name}! The instructions clearly stated a number between 1 and 10.`);
    }else {
        message += (userNumber === randomNumber)
            ? `🎉 You are correct, ${name}! The number was ${randomNumber}.`
            : `❌ You were incorrect, ${name}. The number was ${randomNumber}.`;
    }

    res.send(message);
});
app.use((req, res) => {res.redirect(`/`);});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
