const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const table = require('console.table');
let db;

async function main() {
    db = await mysql.createConnection(
        {
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'company'
        },
        console.log('Connected to the company database.')
    );

    start();
}

const start = () => {
    inquirer.prompt({
        type: 'list',
        name: 'startQuestion',
        message: 'What would you like to do?',
        choices: ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit'],
        loop: true
    }).then(async (data) => {
        switch (data.startQuestion) {
            case 'View All Employees':
                viewEmployees();
                break;
            case 'Add Employee':
                await addEmployee();
                break;
            case 'Update Employee Role':
                await updateEmployee();
                break;
            case 'View All Roles':
                viewRoles();
                break;
            case 'Add Role':
                await addRole();
                break;
            case 'View All Departments':
                await viewDepartments();
                break;
            case 'Add Department':
                await addDepartment();
                break;
            default:
                console.log('Bye!');
                return;
        }
    });
}

// function viewDepartments() {
//     db.query('SELECT * FROM department', (err, result) => {
//         if (err) {
//             console.error(err);
//         }
//         console.table(result);
//         start();
//     });
// }

async function viewDepartments() {
    try {
        const departments = (await queryDepartments())[0];
        console.table(departments);
        start();
    } catch (err) {
        console.error(err);
    }
}

function viewRoles() {
    db.query('SELECT role.id, title, department.name AS department, salary FROM role JOIN department ON role.department_id = department.id;')
    .then((result) => {
        console.log('\n');
        console.table(result[0]);
        start();
    }).catch((err) => {
        console.error(err);
    });
}

function viewEmployees() {
    db.query(`SELECT T1.id, T1.first_name, T1.last_name, role.title, department.name AS department, role.salary, CONCAT(T2.first_name, " ", T2.last_name) AS manager
    FROM ((employee T1 LEFT JOIN employee T2
    ON T1.manager_id = T2.id) JOIN role
    ON T1.role_id = role.id) JOIN department
    ON department_id = department.id;`).then((result) => {
        console.table(result[0]);
        start();
    }).catch((err) => {
        console.error(err);
    });
}

function addDepartment() {
    inquirer.prompt({
        type: 'input',
        name: 'departmentName',
        message: 'What is the name of the department?'
    }).then((res) => {
        db.query('INSERT INTO department (name) VALUES (?)', res.departmentName).then((result) => {
            console.table(result[0]);
            console.log(`\nAdded ${res.departmentName} to the database.`);
            start();
        }).catch((err) => {
            console.error(err);
        });
    });
}

async function addRole() {
    const departments = (await queryDepartments())[0];
    inquirer.prompt([{
        type: 'input',
        name: 'roleName',
        message: 'What is the name of the role?'
    },
    {
        type: 'input',
        name: 'salary',
        message: 'What is the salary of the role?'
    },
    {
        type: 'list',
        name: 'department',
        message: 'Which department does the role belong to?',
        choices: departments.map((department) => department.name)
    }]).then((res) => {
        const department_id = departments.filter((department) => department.name === res.department)[0].id;
        db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [res.roleName, res.salary, department_id]).then(result => {
            console.log(`\nAdded ${res.roleName} to the ${res.department} department.`);
            start();
        }).catch(err => {
            console.error(err);
        });
    }).catch(err => console.error(err));
}

async function addEmployee() {
    const roleResult = (await queryRoles())[0];
    const employeeInfo = (await queryEmployee())[0];
    inquirer.prompt([{
        type: 'input',
        name: 'firstName',
        message: 'What is the employee\'s first name?'
    },
    {
        type: 'input',
        name: 'lastName',
        message: 'What is the employee\'s last name?'
    },
    {
        type: 'list',
        name: 'role',
        message: 'What is the employee\'s role?',
        choices: roleResult.map((role) => role.title)
    },
    {
        type: 'list',
        name: 'manager',
        message: 'Who is the employee\'s manager?',
        choices: employeeInfo.map((role) => `${role.first_name} ${role.last_name}`)
    }]).then((answer) => {
        const { firstName, lastName, role, manager } = answer;
        const roleId = roleResult.filter((elem) => elem.title === role)[0].id;
        const managerId = employeeInfo.filter((elem) => `${elem.first_name} ${elem.last_name}` === manager)[0].id;
        db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [firstName, lastName, roleId, managerId]).then(result => {
            console.log('\nAdded employee to the database.');
            start();
        }).catch(err => console.error(err));
    });
}

async function updateEmployee() {
    const employeeList = (await queryEmployee())[0];
    const roles = (await queryRoles())[0];
    inquirer.prompt([{
        type: 'list',
        name: 'employee',
        message: 'Which employee would you like to update?',
        choices: employeeList.map((employee) => `${employee.first_name} ${employee.last_name}`)
    },
    {
        type: 'list',
        name: 'roleAnswer',
        message: 'Which role is this employee being given?',
        choices: roles.map((role) => role.title)
    }]).then((answer) => {
        const { employee, roleAnswer } = answer;
        const empId = employeeList[employeeList.map((employee) => `${employee.first_name} ${employee.last_name}`).indexOf(employee)].id;
        const roleId = roles[roles.map(role => role.title).indexOf(roleAnswer)].id;
        db.query('UPDATE employee SET role_id = ? WHERE id = ?', [roleId, empId]).then(result => {
            console.log(`\nUpdated employee ${employee}.`);
            start();
        }).catch(err => console.error(err))
    });
}

async function queryEmployee() {
    return db.query('SELECT first_name, last_name, id FROM employee');
}

async function queryRoles() {
    return db.query('SELECT title, id FROM role');
}

async function queryDepartments() {
    return db.query('SELECT * FROM department');
}

main();