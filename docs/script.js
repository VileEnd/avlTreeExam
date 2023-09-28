class AVLNode {
    constructor(key) {
        this.key = key;
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
        this.leftRotations = 0;
        this.rightRotations = 0;
        this.leftRightRotations = 0;
        this.rightLeftRotations = 0;
    }

    height(node) {
        return node ? node.height : 0;
    }

    rightRotate(y) {
        const x = y.left;
        const T = x.right;
        x.right = y;
        y.left = T;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        this.rightRotations++;
        console.log("right rot"+ this.rightRotations);
        this.updateRotationCount();
        return x;
    }

    leftRotate(x) {
        const y = x.right;
        const T = y.left;
        y.left = x;
        x.right = T;
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        this.leftRotations++;
        console.log("left rot"+this.leftRotations)
        this.updateRotationCount()
        return y;
    }

    getBalance(node) {
        return node ? this.height(node.left) - this.height(node.right) : 0;
    }

    insert(node, key) {
        console.log(`Inserting key: ${key}`);
        if (!node) return new AVLNode(key);

        if (key < node.key) {
            node.left = this.insert(node.left, key);
        } else if (key > node.key) {
            node.right = this.insert(node.right, key);
        } else {
            return node;  // Duplicates are not allowed
        }

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        const balance = this.getBalance(node);
        console.log(`Balance after inserting key ${key}: ${balance}`);

        if (balance > 1 && key < node.left.key) {
            console.log(`Right Rotate on node with key ${node.key}`);
            return this.rightRotate(node);
        }

        if (balance < -1 && key > node.right.key) {
            console.log(`Left Rotate on node with key ${node.key}`);
            return this.leftRotate(node);
        }

        if (balance > 1 && key > node.left.key) {
            console.log(`Left-Right Rotate on node with key ${node.key}`);
            node.left = this.leftRotate(node.left);
            this.leftRightRotations++;
            return this.rightRotate(node);
        }

        if (balance < -1 && key < node.right.key) {
            console.log(`Right-Left Rotate on node with key ${node.key}`);
            node.right = this.rightRotate(node.right);
            this.rightLeftRotations++;
            return this.leftRotate(node);
        }
        this.updateRotationCount();
        return node;
    }

    printPreOrder(node) {
        if (node) {
            console.log(node.key);
            this.printPreOrder(node.left);
            this.printPreOrder(node.right);
        }
    }

    printInOrder(node) {
        if (node) {
            this.printInOrder(node.left);
            console.log(node.key);
            this.printInOrder(node.right);
        }
    }

    printPostOrder(node) {
        if (node) {
            this.printPostOrder(node.left);
            this.printPostOrder(node.right);
            console.log(node.key);
        }
    }

    addNode(key) {
        this.root = this.insert(this.root, key);
    }

    updateRotationCount() {
        console.log(`Rotation Counts - Left: ${this.leftRotations}, Right: ${this.rightRotations}, Left-Right: ${this.leftRightRotations}, Right-Left: ${this.rightLeftRotations}`);
        document.getElementById('left-rotations').textContent = this.leftRotations;
        document.getElementById('right-rotations').textContent = this.rightRotations;
        document.getElementById('left-right-rotations').textContent = this.leftRightRotations;
        document.getElementById('right-left-rotations').textContent = this.rightLeftRotations;
    }
}

const tree = new AVLTree();

function addValues() {
    const valueInput = document.getElementById('valueInput');
    const values = valueInput.value.split(/[\s,]+/).map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    console.log('Adding values:', values);
    if (values.length > 0) {
        values.forEach(value => {
            tree.addNode(value);
        });
        valueInput.value = '';
    } else {
        alert('Please enter a valid number or list of numbers, separated by commas or spaces.');
    }
}

let i = 0;

function renderTree() {
    if (!tree.root) {
        alert('The tree is empty. Please add some nodes first.');
        return;
    }

    const margin = {top: 20, right: 120, bottom: 20, left: 120},
        width = 960 - margin.right - margin.left,
        height = 500 - margin.top - margin.bottom;

    // Clear any existing SVG before rendering the new tree
    d3.select("#tree-container").select("svg").remove();

    const svg = d3.select("#tree-container")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const treeLayout = d3.tree().size([width, height]);

    const rootHierarchy = d3.hierarchy(tree.root, d => [d.left, d.right].filter(d => d));
    const treeData = treeLayout(rootHierarchy);

    const nodes = svg.selectAll("g.node")
        .data(treeData.descendants(), d => d.id || (d.id = ++i));

    const nodeEnter = nodes.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodeEnter.append("circle")
        .attr("r", 10)
        .style("fill", "#fff");

    nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -20 : 20)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.key);

    const links = svg.selectAll("path.link")
        .data(treeData.links(), d => d.target.id);

    links.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        );
}

    function printTraversals() {
        const logArea = document.getElementById('consoleLog');
        logArea.innerHTML = '';  // Clear the previous logs

        logArea.innerHTML += "PreOrder Traversal:<br>";
        logTraversal(tree.printPreOrder, tree.root, logArea);

        logArea.innerHTML += "<br>InOrder Traversal:<br>";
        logTraversal(tree.printInOrder, tree.root, logArea);

        logArea.innerHTML += "<br>PostOrder Traversal:<br>";
        logTraversal(tree.printPostOrder, tree.root, logArea);
    }

    function logTraversal(traversalFunction, node, logArea) {
        const originalLogFunction = traversalFunction;
        tree[traversalFunction] = function(node) {
            originalLogFunction.call(tree, node, (message) => {
                logArea.innerHTML += message + '<br>';
            });
        };
        tree[traversalFunction](node);
        tree[traversalFunction] = originalLogFunction;
    }

    function updateLogMethods() {
        const traversalMethods = ['printPreOrder', 'printInOrder', 'printPostOrder'];
        traversalMethods.forEach(method => {
            const originalMethod = AVLTree.prototype[method];
            AVLTree.prototype[method] = function(node, logger = console.log) {
                if (node) {
                    logger(node.key);
                    this[method](node.left, logger);
                    this[method](node.right, logger);
                }
            };
        });
    }

    updateLogMethods();