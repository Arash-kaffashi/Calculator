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

		let { unallowed } = Formula.RESTRICTIONS(this.lastInput);

		COMMANDS.forEach((cmd) => {
			let buttons = Array.from(
				document.getElementsByClassName(cmd.toLowerCase())
			);
			if (unallowed.includes(cmd))
				buttons.forEach((el) => el.classList.add("disabled"));
			else buttons.forEach((el) => el.classList.remove("disabled"));
		});
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
			let { unallowed, handle } = Formula.RESTRICTIONS(this.lastInput);

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
					// REMOVES LAST AND ADD'S THE DIGIT
					this.replace(
						-1,
						new Input(
							this.lastInput.group,
							this.lastInput.group === "INTEGER"
								? Number(this.lastInput.value + value).toString()
								: this.lastInput.value + value
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
						if (!Number.isInteger(result)) {
							// NUMBER TOO BIG => ROUND
							let temp = round(result);
							ipt =
								temp.length > 9
									? new Input("FLOAT", round(result).toFixed(8))
									: new Input("FLOAT", temp.toString());
						} else new Input("INTEGER", result.toExponential(2));
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
						OPERATOR: (formula, { value }) =>
							formula.replace(-1, new Input(group, value)),
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
	formula: new Formula(document.querySelector(".display")),
};

function pushToFormula(operator) {
	let CMD;
	switch (operator) {
		case "/":
		case "*":
		case "-":
		case "+":
			CMD = new Command("OPERATOR", operator);
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
			CMD = new Command("DIGIT", operator);
			break;
		case ".":
		case ",":
			CMD = new Command("DOT", ".");
			break;
		case "Enter":
		case "=":
			CMD = new Command("RESULT");
			break;
		case "c":
		case "C":
			CMD = new Command("CLEAR");
			break;
		default:
			console.log("No assigned:", operator);
			return;
	}
	state.formula.push(CMD);
	console.table(state.formula.inputs);
}

function handleOperand(e) {
	pushToFormula(e.target.textContent);
}

Array.from(document.querySelectorAll(".button")).forEach((button) => {
	button.addEventListener("click", handleOperand);
});

document.querySelector("body").addEventListener("keydown", (event) => {
	pushToFormula(event.key);
});
