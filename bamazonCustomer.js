require("dotenv").config();

const keys = require("./keys.js");
const mysql = require("mysql");
const inquirer = require("inquirer");

let chosenItem = {};

const connection = mysql.createConnection({
  host: "localhost",

  port: 3306,

  user: "root",

  password: keys.password,
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  // console.log("connected as id " + connection.threadId);
  displayProducts();
});

function displayProducts() {
	console.log(`----------------------------------------------------------------`);
	console.log(`Please see below for available products!`)
	console.log(`----------------------------------------------------------------`);
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      console.log(`${res[i].item_id} | ${res[i].product_name} | ${res[i].department_name} | $${res[i].price} | ${res[i].stock_quantity}`);
    }
    console.log(`----------------------------------------------------------------`);
    start();
  });
}

function start() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    inquirer
      .prompt([
        {
          type: "input",
          message: "Please enter the ID of the product you would like to purchase",
          name: "id"
        },
        {
          type: "input",
          message: "Please enter the quantity you would like to purchase",
          name: "quantity"
        },
      ])
      .then(function(answer) {
        let item = parseFloat(answer.id) - 1;
				
        if (item > res.length - 1 || item < 0) {
          connection.end();
          console.log("Please enter a valid Product ID")
        } else {
						if (answer.quantity > res[item].stock_quantity) {
							console.log("Insufficient quantity! Please start over");
							start()
						} else {
								chosenItem = {
									item_id: res[item].item_id,
									product_name: res[item].product_name,
									department_name: res[item].department_name,
									price: res[item].price,
									stock_quantity: res[item].stock_quantity,
									chosen_quantity: parseFloat(answer.quantity)
								};
								// console.log(chosenItem);
								updateQuantity()
							}
        	}
      });
  });
}

function updateQuantity() {
  let newQuantity = chosenItem.stock_quantity - chosenItem.chosen_quantity;
  let itemID = chosenItem.item_id;
  connection.query("UPDATE products SET ? WHERE ?",
    [{stock_quantity: newQuantity}, {item_id: itemID}], function(err, res) {
      if (err) throw err;
  });
  fulfillOrder()
}

function fulfillOrder() {
	let orderTotal = chosenItem.chosen_quantity * chosenItem.price;
	let orderTotalRounded = Math.round(orderTotal * 100) / 100;
	
  console.log(`Your order for ${chosenItem.product_name} has been received! Your order total is: $${orderTotalRounded}`);

  inquirer
    .prompt([
			{
			type: "list",
			message: "Would you like to purchase anything else?",
			choices: ["Yes", "No"],
			name: "restart"
			}
    ])
    .then(function(answer) {
      if (answer.restart === "Yes") {
				displayProducts()
			} else {
				console.log("Thank you for your order!");
				connection.end();
			}
    });
}