SELECT T1.id, T1.first_name, T1.last_name, role.title, department.name AS department, role.salary, CONCAT(T2.first_name, " ", T2.last_name) AS manager
FROM ((employee T1 LEFT JOIN employee T2
ON T1.manager_id = T2.id) JOIN role
ON T1.role_id = role.id) JOIN department
ON department_id = department.id;
