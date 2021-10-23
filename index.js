const inquirer = require('inquirer');
const mysql = require('mysql2');
const table = require('console.table');

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'Plutonium1!',
        database: 'company'
    },
    console.log('Connected to the company database')
);

const start = () => {
    inquirer.prompt({
        type: 'list',
        name: 'startQuestion',
        message: 'What would you like to do?',
        choices: ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit'],
        loop: true
    }).then((data) => {
        switch (data.startQuestion) {
            case 'View All Employees':
                viewEmployees();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':

                break;
            case 'View All Roles':
                viewRoles();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'View All Departments':
                viewDepartments();
                break;
            case 'Add Department':
                addDepartment();
                break;
            default:
                console.log('Bye!');
                return;
        }
        // start();
    });
};

function viewDepartments() {
    db.query('SELECT * FROM department', (err, result) => {
        if (err) {
            console.error(err);
        }
        console.table(result);
        start();
    });
}

function viewRoles() {
    db.query('SELECT role.id, title, department.name AS department, salary FROM role JOIN department ON role.department_id = department.id;', (err, result) => {
        if (err) {
            console.error(err);
        }
        console.log('\n');
        console.table(result);
        start();
    });
}

function viewEmployees() {
    db.query(`SELECT T1.id, T1.first_name, T1.last_name, role.title, department.name AS department, role.salary, CONCAT(T2.first_name, " ", T2.last_name) AS manager
    FROM ((employee T1 LEFT JOIN employee T2
    ON T1.manager_id = T2.id) JOIN role
    ON T1.role_id = role.id) JOIN department
    ON department_id = department.id;`, (err, result) => {
        if (err) {
            console.error(err);
        }
        console.table(result);
        start();
    });
}

function addDepartment() {
    inquirer.prompt({
        type: 'input',
        name: 'departmentName',
        message: 'What is the name of the department?'
    }).then((res) => {
        db.query('INSERT INTO department (name) VALUES (?)', res.departmentName, (err, result) => {
            if (err) {
                console.error(err);
            }
            console.table(result);
            console.log('\nAdded Service to the database.');
            start();
        });
    });
}

function addRole() {
    inquirer.prompt([{
        type: 'input',
        name: 'roleName',
        message: 'What is the name of the role?'
    },
    {
        type: 'input',
        name: 'salary',
        message: 'What is the salary of the role?'
    }]).then((res) => {
        db.query('SELECT name FROM department', (err, result) => {
            if (err) {
                console.error(err);
            }
            inquirer.prompt({
                type: 'list',
                name: 'department',
                message: 'Which department does the role belong to?',
                choices: result.map((department) => department.name)
            }).then((answer) => {
                db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [res.roleName, res.salary, answer.department], (err, result) => {
                        if (err) {
                            console.error(err);
                        }
                        console.log('\nAdded Customer Service to the database.');
                        start();
                });
            });
        });
    });
}

function addEmployee() {
    inquirer.prompt([{
        type: 'input',
        name: 'firstName',
        message: 'What is the employee\'s first name?'
    },
    {
        type: 'input',
        name: 'lastName',
        message: 'What is the employee\'s last name?'
    }]).then((nameAnswer) => {
        const { firstName, lastName } = nameAnswer;
        db.query('SELECT title, id FROM role', (err, roleResult) => {
            if (err) {
                console.error(err);
            }
            inquirer.prompt({
                type: 'list',
                name: 'role',
                message: 'What is the employee\'s role?',
                choices: roleResult.map((role) => role.title)
            }).then((roleAnswer) => {
                const { role } = roleAnswer;
                const roleId = roleResult.filter((elem) => elem.title === role)[0].id;
                db.query('SELECT first_name, last_name, id FROM employee', (err, employeeInfo) => {
                    if (err) {
                        console.error(err);
                    }
                    // console.log(info);
                    employeeInfo.push({ firstName})
                    inquirer.prompt({
                        type: 'list',
                        name: 'manager',
                        message: 'Who is the employee\'s manager?',
                        choices: employeeInfo.map((role) => `${role.first_name} ${role.last_name}`)
                    }).then((managerAnswer) => {
                        const { manager } = managerAnswer;
                        const managerId = employeeInfo.filter((elem) => `${elem.first_name} ${elem.last_name}` === manager)[0].id;
                        db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [firstName, lastName, roleId, managerId], (err, result) => {
                            if (err) {
                                console.error(err);
                            }
                            console.log('\nAdded employee to the database.');
                            start();
                        })
                    });
                });
            });
        });
    });
}

start();