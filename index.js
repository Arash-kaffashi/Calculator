const operations = {
	"+": (a, b) => a + b,
	"-": (a, b) => a - b,
	"*": (a, b) => a * b,
	"/": (a, b) => a / b,
};

const operate = ([a, operator, b]) => {
	return operations[operator](a, b);
};

const COMMANDS = ["CLEAR", "DIGIT", "DOT", "OPERATOR", "RESULT"];

class Restriction {
	constructor(
		{ unallowed = [], replace = [], handle = {} } = {
			unallowed: [],
			replace: [],
			handle: {},
		}
	) {
		/* 		this.allowed = COMMANDS.filter(
			(cmd) => !([...unallowed, ...replace, ...Object.keys(handle)].includes(cmd))
		); */
		this.unallowed = unallowed;
		this.replace = replace;
		this.handle = handle;
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
	constructor(command, value, isDecimal = false) {
		this.command = command;
		this.value = value;
		this.isDecimal = isDecimal;
		return this;
	}
}

class Formula {
	constructor(display, initialValue = ["DIGIT", "0"]) {
		this.display = display;
		this.initialValue = new Input(...initialValue);
		this.inputs = [this.initialValue];
		return this;
	}
	updateDisplay() {
		this.display.textContent = this.inputs.reduce(
			(text, { command, value }) => {
				switch (command) {
					case "OPERATOR": // add spaces
						return `${text} ${value} `;
						break;
					case "DOT":
						console.log("dot");
					case "DIGIT": // concatenate
						return text + value;
						break;
					case "ERROR":
					case "RESULT":
						return value;
						break;
					default:
						throw Error("unespected behavior");
				}
			},
			""
		);
	}
	clear(value) {
		this.inputs = [value ?? this.initialValue];
		return this;
	}
	get lastInput() {
		return this.inputs[this.inputs.length - 1];
	}
	push({ command, value }) {
		if (this.lastInput) {
			let { unallowed, replace, handle } = Formula.RESTRICTIONS(this.lastInput);

			if (unallowed.includes(command)) {
				console.log("unallowed command: ", command);
				return;
			}
			if (replace.includes(command)) {
				// replaces the last input
				this.inputs.splice(-1, 1, new Input(command, value));
				this.updateDisplay();
				return;
			}
			if (command in handle) {
				this.inputs.push(handle[command]);
				this.updateDisplay();
				return;
			}
		}

		switch (command) {
			case "DOT":
				this.inputs.splice(
					-1,
					1,
					Object.assign({}, this.lastInput, {
						value: this.lastInput.value + value,
						isDecimal: true,
					})
				);

				break;
			case "DIGIT":
				if (this.lastInput?.command == "DIGIT") {
					this.inputs.splice(
						-1,
						1,
						Object.assign({}, this.lastInput, {
							value: String(Number(this.lastInput.value + value)),
						})
					);
				} else {
					this.inputs.push(
						new Input(command, value, this.lastInput?.isDecimal)
					);
				}
				break;
			case "OPERATOR":
			case "RESULT":
				if (command === "RESULT") {
					if (this.inputs.length == 2)
						this.inputs.push(Object.assign({}, this.inputs[0]));
					if (this.inputs.length == 1) break;
				}
				if (this.inputs.length >= 3) {
					let mappedInputs = this.inputs.map((input) =>
						input.command === "DIGIT" ? Number(input.value) : input.value
					);
					let result = operate(mappedInputs);

					if (isNaN(result) || !isFinite(result))
						this.clear(new Input("ERROR", isNaN(result) ? "ERROR" : result));
					else {
						let isDecimal = !Number.isInteger(result);
						let numbr = result;

						if (isDecimal && String(result).length > 9) {
							if (String(result).length > 9) {
								let pow = Math.min((result % 1).toString().length, 10);
								numbr = (
									Math.round(result * Math.pow(10, pow)) / Math.pow(10, pow)
								).toPrecision(7);
								alert("Result was rounded!");
							}
						}
						this.clear(new Input("DIGIT", numbr.toString(), isDecimal));
					}
				}
				if (command === "OPERATOR") this.inputs.push(new Input(command, value));
				break;
			case "CLEAR":
				this.clear();
				break;
			default:
				console.log(command);
				throw Error("UNKNOW COMMAND: " + command);
				break;
		}
		this.updateDisplay();
	}
	static RESTRICTIONS({ command, isDecimal }) {
		if (isDecimal) return new Restriction({ unallowed: ["DOT"] });
		// allowed : ['CLEAR', 'DIGIT', 'OPERATOR', 'RESULT']
		// else
		switch (command) {
			case "OPERATOR":
				return new Restriction({
					replace: ["OPERATOR"],
					handle: {
						DOT: new Input("DIGIT", "0.", true),
					},
					// allowed : ['DIGIT']
				});
				break;
			case "ERROR":
				return new Restriction({
					unallowed: ["DIGIT", "DOT", "OPERATOR", "RESULT"],
				});
			case "CLEAR":
			case "DIGIT":
			case "RESULT":
				return new Restriction();
				// allowed : ["CLEAR", "DIGIT", "DOT", "OPERATOR", "RESULT"]
				break;

				break;
			default:
				console.log(command);
				throw Error("UNKNOW COMMAND");
				break;
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
