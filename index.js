const operations = {
	"+": (a, b) => a + b,
	"-": (a, b) => a - b,
	"*": (a, b) => a * b,
	"/": (a, b) => a / b,
};

const operate = ([a, operator, b]) => {
	return operations[operator](a, b);
};

const round = (number) => {
	return Math.round(number * Math.pow(10, 10)) / Math.pow(10, 10);
};

const COMMANDS = ["CLEAR", "DIGIT", "DOT", "OPERATOR", "RESULT"];

class Restriction {
	constructor(cases) {
		/* 		this.allowed = COMMANDS.filter(
			(cmd) => !([...unallowed, ...replace, ...Object.keys(handle)].includes(cmd))
		); */
		this.unallowed = cases?.unallowed ?? [];
		this.handle = cases?.handle ?? {};
		return this;
	}
}

class Command {
	constructor(command, value = null) {
		this.command = command;
		this.value = value;
		return this;
	}
}

class Input {
	constructor(group, value) {
		this.group = group;
		this.value = value;
		return this;
	}
}

class Formula {
	constructor(display, initialValue = ["INTEGER", "0"]) {
		this.display = display;
		this.initialValue = new Input(...initialValue);
		this.inputs = [this.initialValue];
		return this;
	}
	get lastInput() {
		return this.inputs[this.inputs.length - 1];
	}
	updateDisplay() {
		this.display.textContent = this.inputs.reduce((text, { group, value }) => {
			switch (group) {
				case "OPERATOR": // add spaces
					return `${text} ${value} `;
				case "INTEGER": // concatenate
				case "FLOAT":
					return text + value;
				case "ERROR": // returns the last value
				case "RESULT":
					return value;
				default:
					throw Error("Unexpected behavior");
			}
		}, "");
	}
	clear(value) {
		this.inputs = [value ?? this.initialValue];
		return this;
	}
	replace(index, input) {
		this.inputs.splice(index, 1, input);
		return this;
	}
	push(CMD) {
		let { command, value } = CMD;
		// CHECK RESTRICTIONS
		if (this.lastInput) {
			let { unallowed, replace, handle } = Formula.RESTRICTIONS(this.lastInput);

			if (unallowed.includes(command)) {
				// RETURNS
				console.log("unallowed command: ", command);
				return;
			}
			if (command in handle) {
				// CUSTOM HANDLE OF INPUT
				this.inputs.push(handle[command](this, CMD));
				this.updateDisplay();
				return;
			}
			// NOT ONE OF THE ABOVE, CONTINUE AS AN ALLOWED CASE
		}
		// COMMAND AS INPUT TO THE FORMULA
		switch (command) {
			case "DOT": // CONVERT INTEGER TO FLOAT
				this.replace(-1, new Input("FLOAT", this.lastInput.value + value));
				break;
			case "DIGIT": // ADD OPERAND OR UPDATES WITH THE NEW DIGIT
				if (["INTEGER", "FLOAT"].includes(this.lastInput.group)) {
					// REMOVES LAST AND ADD'S A DIGIT
					this.replace(
						-1,
						new Input(
							this.lastInput?.group ?? "INTEGER",
							Number(this.lastInput.value + value).toString()
						)
					);
				} else {
					// ADD OPERAND
					this.inputs.push(new Input("INTEGER", value));
				}
				break;
			case "OPERATOR":
			case "RESULT":
				if (command === "RESULT") {
					if (this.inputs.length == 2)
						// COPY LAST INTEGER/FLOAT TO DO THE OPERATION
						this.inputs.push(Object.assign({}, this.inputs[0]));
					if (this.inputs.length == 1) throw ERROR("Unexpected behavior");
				}
				if (this.inputs.length >= 3) {
					// OPERATE. Expected: [NUMBER OPERATOR NUMBER]
					let mappedInputs = this.inputs.map(
						(
							input // CONVERTS INTEGER/FLOAT FROM STRING TO NUMBER
						) =>
							["INTEGER", "FLOAT"].includes(input.group)
								? Number(input.value)
								: input.value
					);
					let result = operate(mappedInputs);
					let ipt;

					if (isNaN(result) || !isFinite(result))
						// INFINITE OR ERROR
						ipt = new Input("ERROR", isNaN(result) ? "ERROR" : result);
					else if (result.toString().length > 9)
						// NUMBER TOO BIG => ROUND
						ipt = !Number.isInteger(result)
							? new Input("FLOAT", round(result).toFixed(8))
							: new Input("INTEGER", result.toExponential(2));
					// NOTHING TO HANDLE
					else
						ipt = new Input(
							!Number.isInteger(result) ? "FLOAT" : "INTEGER",
							result.toString()
						);

					// REPLACES WITH THE RESULT
					this.clear(ipt);
				}
				// AFTER OPERATION PUSH NEXT OPERATOR
				if (command === "OPERATOR") this.inputs.push(new Input(command, value));
				break;
			case "CLEAR":
				this.clear();
				break;
			default:
				throw Error("Unexpected  COMMAND: " + command);
		}
		this.updateDisplay();
	}
	static RESTRICTIONS({ group }) {
		switch (group) {
			case "OPERATOR":
				return new Restriction({
					handle: {
						DOT: () => new Input("FLOAT", "0.", true),
						OPERATOR: ({ inputs }, { value }) =>
							this.inputs.splice(-1, 1, new Input(group, value)),
					},
				});
			case "ERROR":
				return new Restriction({
					unallowed: ["DIGIT", "DOT", "OPERATOR", "RESULT"],
				});
			case "FLOAT":
				return new Restriction({
					unallowed: ["DOT"],
				});
			case "CLEAR":
			case "INTEGER":
			case "RESULT":
				return new Restriction();
			default:
				throw Error("UNKNOW COMMAND");
		}
	}
}

let state = {
	previousButton: null,
	formula: new Formula(document.querySelector(".display")),
};

function handleOperand(e) {
	let operator = e.target.textContent;
	let c;
	switch (operator) {
		case "/":
		case "*":
		case "-":
		case "+":
			c = new Command("OPERATOR", operator);
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
			c = new Command("DIGIT", operator);
			break;
		case ".":
			c = new Command("DOT", operator);
			break;
		case "=":
			c = new Command("RESULT");
			break;
		case "C":
			c = new Command("CLEAR");
			break;
		default:
			throw Error("UNKNOW COMMAND");
			break;
	}
	state.formula.push(c);
	console.table(state.formula.inputs);
}

Array.from(document.querySelectorAll(".button")).forEach((button) => {
	button.addEventListener("click", handleOperand);
});
