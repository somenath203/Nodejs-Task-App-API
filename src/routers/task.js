const express = require('express');
const Task = require('../models/task');
const auth = require('../middlware/auth');

const router = express.Router();


// creating new task
router.post('/tasks', auth, async (req, res) => {


    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {

        await task.save();

        res.status(201).send({
            "message": "task created successfully",
            task: task
        });

    } catch (error) {

        res.status(500).send(error);

    }

});


// getting all tasks (a user should be authenticated first and then fetch his/her task only).

// GET /tasks?completed=true OR GET /tasks?completed=false => filtering

// GET /tasks?limit=10&skip=10 => pagination

// GET /tasks?sortBy=createdAt:desc


router.get('/tasks', auth, async (req, res) => {

    const match = {};

    const sort = {};

    try {

        if (req.query.completed) {

            match.completed = req.query.completed === 'true' ? true : false

            // sorting query
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
            }

            const tasks = await Task.find(
                { owner: req.user._id, completed: match.completed },
                null,
                {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort: sort
                }
            );

            res.status(200).send({
                "message": "successfully fetched all the tasks",
                "numberOfTasks": tasks.length,
                "tasks": tasks
            });

        } else {

            // sorting
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
            }

            const tasks = await Task.find(
                { owner: req.user._id },
                null,
                {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort: sort
                }
            );

            res.status(200).send({
                "message": "successfully fetched all the tasks",
                "numberOfTasks": tasks.length,
                "tasks": tasks
            });

        }

    } catch (error) {

        res.status(500).send(error);

    }
});


// getting a particular task by id (a user should be authenticated first and then fetch his/her task only).
router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id;

    try {

        const task = await Task.findOne({ _id: _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send({
                message: "failed to fetch the task"
            });
        }

        res.status(200).send({
            "message": "successfully fetched the task",
            "task": task
        });

    } catch (error) {

        res.status(404).send(error);

    }

});

// update a particular task
router.patch('/tasks/:id', auth, async (req, res) => {

    const enteredFieldKeys = Object.keys(req.body);

    const allowedFieldKeys = ["description", "completed"];

    const isValidFields = enteredFieldKeys.every((key) => {
        return allowedFieldKeys.includes(key);
    });

    if (!isValidFields) {
        return res.status(404).send({
            message: "Invalid update of Task!"
        })
    }

    try {

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send({
                message: "you are not authorized to update this task or the task won't exist!"
            });
        }

        enteredFieldKeys.forEach((key) => {
            task[key] = req.body[key];
        });

        await task.save();

        res.status(201).send({
            "message": "task updated successfully",
            "task": task
        });

    } catch (error) {

        res.status(400).send(error);

    }
});

// delete a particular task by id
router.delete('/tasks/:id', auth, async (req, res) => {

    try {

        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            res.status(404).send({
                "message": "you are not authorized to delete this task or the task won't exist!"
            });
        }



        res.status(200).send({
            "message": "task deleted successully"
        });


    } catch (error) {
        res.status(500).send(error);
    }

});


module.exports = router;


