const operators = {
	add: (a, b) => a + b,
	subtract: (a, b) => a - b,
	multiply: (a, b) => a * b,
	divite: (a, b) => a / b,
};

let state = {
	previousButton: null,
	operations: [],
};

function operate(operator, a, b) {}

function handleOperand(e) {
	let op = e.target.textContent;

	switch (op) {
		case "C":
			break;
		case "/":
			break;
		case "*":
			break;
		case "-":
			break;
		case "+":
			state.operations.push("+");
			break;
		case "=":
			break;
		case ".":
			break;
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
		case "0":
			console.log(+op);
			break;
	}
}

Array.from(document.querySelectorAll(".button")).forEach((button) => {
	button.addEventListener("click", handleOperand);
});
