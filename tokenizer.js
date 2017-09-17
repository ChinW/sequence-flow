function log(...str) {
    return console.log(...str);
}

const TYPE = {
    VAR: 'Variable',
    OP: 'Operation',
    VALUE: 'Value'
};

const OperationTag = {
    LP: '(',
    RP: ')',
    LB: '[',
    RB: ']',
    COMMA: ',',
    ARROW_L: '>',
    ARROW_R: '<',
    ARROW_LR: '<>',
    COLON: ':',
    EQ: '=',
    HASH: "#",
    CENTER_STUB: "-"
};
const RELATION_OP = [OperationTag.ARROW_L, OperationTag.ARROW_R, OperationTag.ARROW_LR];
const OPERATIONS = Object.values(OperationTag);
const STATUS = Object.assign({
    LEFT: 'left',
    RIGHT: 'right'
}, OperationTag);

function Token(type, value) {
    this.type = type;
    this.value = value;
}

function ParserError(coloumn, msg) {
    this.coloumn = coloumn;
    this.msg = msg;
}

function tokenize(str) {
    const result = [];
    let letterBuffer = [];
    let operationBuffer = [];
    let tokens = [];
    let status = STATUS.LEFT;
    let i = 0;
    const errors = [];
    str = strip(str);
    line = strip(str);
    line = line.split('');

    const pushLetter = () => {
        if (letterBuffer.length > 0) {
            if (tokens.length - 1 > -1 && tokens[tokens.length - 1].type === TYPE.VAR) {
                errors.push(new ParserError(i, `Syntax Error: ${str}\n Need Comma`));
            }
            tokens.push(new Token(TYPE.VAR, letterBuffer.join('')));
            letterBuffer = [];
        }
    };

    const pushOperation = () => {
        if (operationBuffer.length > 0) {
            tokens.push(new Token(TYPE.OP, operationBuffer.join('')));
            operationBuffer = [];
        }
    };

    const parseBracket = (e, terminateSign) => {
        if (isLetter(e)) {
            letterBuffer.push(e);
        } else if (e === STATUS.COMMA) {
            if (letterBuffer.length > 0) {
                pushLetter();
                tokens.push(new Token(TYPE.OP, STATUS.COMMA));
            } else {
                errors.push(new ParserError(0, `Syntax Error: ${str}`));
            }
        } else if (e === terminateSign) {
            pushLetter();
            tokens.push(new Token(TYPE.OP, terminateSign));
            status = STATUS.LEFT;
         } else if (isSpace(e)) {
            pushLetter();
            pushOperation();
         } else {
            errors.push(new ParserError(i, `Syntax Error: ${str}`));
         }
    };

    for (i = 0; i < line.length && errors.length === 0; i++) {
        let e = line[i];
        if (status === STATUS.LEFT) {
            if (isLetter(e)) {
                letterBuffer.push(e);
            } else if (isOperation(e)) {
                pushLetter(); 
                operationBuffer.push(e);
                const operation = operationBuffer.join('');
                const length = OPERATIONS.filter((e) => e.indexOf(operation) === 0).length;
                if (length === 1) {
                    pushOperation();
                    if ([STATUS.CENTER_STUB, STATUS.HASH].indexOf(operation) > -1 && tokens.length === 1) {
                        status = STATUS.RIGHT;
                    } else if (operation === ':' || operation === '=') {
                        status = STATUS.RIGHT;
                    } else if (operation === '(') {
                        status = STATUS.LP;
                    } else if (operation === '[') {
                        status = STATUS.LB;
                    }
                } else if (length < 1) {
                    return new ParserError(i, `Syntax Error: ${str}`);
                } else {
                    continue;
                }
            } else if (isSpace(e)) {
                pushLetter();
                pushOperation();
                continue;
            } else {
                errors.push(new ParserError(i, `Syntax Error: ${str}`));
            }
        } else if (status === STATUS.LP) {
            parseBracket(e, STATUS.RP);
        } else if (status === STATUS.LB) {
            parseBracket(e, STATUS.RB);
        } else if (status === STATUS.RIGHT) {
            tokens.push(new Token(TYPE.VALUE, str.substr(i)));
            break;
        } else {
            errors.push(new ParserError(0, `Syntax Error: ${str}`));
        }
        if(i + 1 === line.length) {
            pushLetter();
            pushOperation();
        }
    }
    return errors.length > 0 ? errors : tokens;
}

function isLetter(ch) {
    return /[a-z_A-Z0-9]/.test(ch);
}

function isOperation(ch) {
    return OPERATIONS.indexOf(ch) > -1;
}

function isSpace(ch) {
    return /[\s\t]/.test(ch);
}

function strip(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function Parser() {
    this.painter = new Painter();
    this.errorHandling = () => {};
    this.subjects = {};

    this.l1 = {
        expression: (tokens) => {
            try {
                let leftTokens = this.l2.relationship(tokens);
                leftTokens = this.l2.input(leftTokens);
                leftTokens = this.l2.output(leftTokens);
                this.l2.description(leftTokens);
            } catch(err) {
                console.log(err);
            }
        },
        comment: (tokens) => {
            
        },
        separator: (tokens) => {
            
        }
    };
    this.l2 = {
        relationship: null,
        input: null,
        output: null,
        description: null
    };
    this.l3 = {
        operator: (token) => {
            if (token.type === TYPE.OP) {
                return token;
            } else {
                throw 'the target type is not an operator';
            }
        },
        subject: (token) => {
            if (token.type === TYPE.VAR) {
                return token;
            } else {
                throw 'the target type is not a subject';
            }
        },
        description: (token) => {
            if (token.type === TYPE.VALUE) {
                return token;
            } else {
                throw 'the target type is not a description';
            }
        }
    };

    this.l2.relationship = (tokens) => {
        const createSubject = (codeID, value, force = false) => {
            this.subjects[codeID] = value;
        };
        let op = this.l3.operator(tokens[1]);
        let leftTokens = [];
        if (op.value === STATUS.COLON) {               
            const sub1 = this.l3.subject(tokens[0]);
            const sub2 = this.l3.subject(tokens[2]);
            createSubject(sub1, sub2);
            this.painter.create.subjects(this.subjects);
            leftTokens = tokens.slice(2);
        } else if(RELATION_OP.indexOf(op.value) > -1) {
            const sub1 = this.l3.subject(tokens[0]);
            const sub2 = this.l3.subject(tokens[2]);
            this.subjects[sub1] = sub2;
            this.painter.create.subjects();
            leftTokens = tokens.slice(2);
        } else if (op.value === STATUS.EQ) {
            const sub1 = this.l3.subject(tokens[0]);

            this.subjects[sub1] = sub2;
            this.painter.create.subjects();
            leftTokens = tokens.slice(1);
        } else {
            throw `Error happened in l2.relationship`;
        }
        return leftTokens;
    };
    this.l2.input = (tokens) => {

    };
    this.l2.output = (tokens) => {

    };
    this.l2.description = (tokens) => {
        
    };

    this.run = () => {
        let input = testInput;
        input = input.split('\n');
        console.log(input);
        input.map(line => {
            if(line.length > 0) {
                const tokens = tokenize(line);
                if(tokens.length > 0) {
                    switch(tokens[0]) {
                        case STATUS.HASH:
                        parser.l1.comment(tokens);
                        break;
                        case STATUS.CENTER_STUB:
                        parser.l1.cutOffLine(tokens);
                        break;
                        default:
                        parser.l1.expression(tokens);
                        break;
                    }
                }
                console.log(tokens);   
            }
        });
    };
}

function Painter() {
    const subjects = document.getElementById('flow-subjects');
    this.create = {
        subjects: (subjects) => {
            log('create subjects', arguments);
            const node = document.createElement("div");
            node.className = "subject";
            node.id = "tmp";
            
            // subjects.appendChild();
        },
        flow: () => {
            log('create flow', arguments);
        },
        separator: () => {
            log('create separator', arguments);
        },
        group: () => {
            log('create group', arguments);
        },
        input: () => {
            log('create input', arguments);
        },
        output: () => {
            log('create output', arguments);
        }
    };
    this.createFlow = () => {};
}

const parser = new Parser();

// log(tokenize("A <> B(ccc, 123  )[12323, 2133]: 1123123 12312312399 123j12i3ji123123 123123"));
// log(tokenize("A > B[12323, 2133123]: 1123123 12312312399 123j12i3ji123123 123123"));
// log(tokenize("A = 23"));
// log(tokenize("A > B"));
// log(tokenize("  - A = 23"));
// log(tokenize("  # A = 23"));

const testInput = `
A <> B(apple, pen)[pineapple]: delicious
`;

parser.run();