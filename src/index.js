const express = require('express');

require('./db/mongoose');

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');


const app = express();

const port = process.env.PORT;


app.use(express.json());


// user-router
app.use(userRouter);

// task-router
app.use(taskRouter);


app.listen(port, () => {
    console.log(`server is listening at PORT ${port}`);
});








