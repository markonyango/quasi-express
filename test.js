var counter = 0;
try {
    setInterval(function () {
        console.log(counter++);
    }, 1000);
} catch (error) {
    console.log(error);
}
