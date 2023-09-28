class AVLNode {
    constructor(key) {
        this.key = key;
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class UIUpdater {
    constructor() {
        this.leftRotations = 0;
        this.rightRotations = 0;
        this.leftRightRotations = 0;
        this.rightLeftRotations = 0;
    }

    incrementLeftRotations() {
        this.leftRotations++;
        this.updateRotationCount();
    }

    incrementRightRotations() {
        this.rightRotations++;
        this.updateRotationCount();
    }
    decrementLeftRightRotation(){
        this.leftRotations --;
        this.rightRotations--;
    }

    incrementLeftRightRotations() {
        this.leftRightRotations++;
        this.decrementLeftRightRotation();
        this.updateRotationCount();
    }

    incrementRightLeftRotations() {
        this.rightLeftRotations++;
        this.decrementLeftRightRotation()
        this.updateRotationCount();
    }

    updateRotationCount() {
        document.getElementById('left-rotations').textContent = this.leftRotations;
        document.getElementById('right-rotations').textContent = this.rightRotations;
        document.getElementById('left-right-rotations').textContent = this.leftRightRotations;
        document.getElementById('right-left-rotations').textContent = this.rightLeftRotations;
    }

}

class AVLTree {
    constructor(uiUpdater) {
        this.root = null;
        this.uiUpdater = uiUpdater
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
        this.uiUpdater.incrementRightRotations()
        return x;
    }

    leftRotate(x) {
        const y = x.right;
        const T = y.left;
        y.left = x;
        x.right = T;
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        this.uiUpdater.incrementLeftRotations()
        return y;
    }

    getBalance(node) {
        return node ? this.height(node.left) - this.height(node.right) : 0;
    }

    insert(node, key) {
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

        if (balance > 1 && key < node.left.key) {
            return this.rightRotate(node);
        }

        if (balance < -1 && key > node.right.key) {
            return this.leftRotate(node);
        }

        if (balance > 1 && key > node.left.key) {
            node.left = this.leftRotate(node.left);
            this.uiUpdater.incrementLeftRightRotations()
            return this.rightRotate(node);
        }

        if (balance < -1 && key < node.right.key) {
            node.right = this.rightRotate(node.right);
            this.uiUpdater.incrementRightLeftRotations()
            return this.leftRotate(node);
        }

        return node;
    }

    addNode(key) {
        this.root = this.insert(this.root, key);
    }

    printPreOrder(node = this.root, logger = console.log) {
        if (node) {
            logger(node.key);  // Visit node
            this.printPreOrder(node.left, logger);  // Visit left subtree
            this.printPreOrder(node.right, logger);  // Visit right subtree
        }
    }

    printInOrder(node = this.root, logger = console.log) {
        if (node) {
            this.printInOrder(node.left, logger);  // Visit left subtree
            logger(node.key + " ");  // Visit node
            this.printInOrder(node.right, logger);  // Visit right subtree
        }
    }

    printPostOrder(node = this.root, logger = console.log) {
        if (node) {
            this.printPostOrder(node.left, logger);  // Visit left subtree
            this.printPostOrder(node.right, logger);  // Visit right subtree
            logger(node.key + " ");  // Visit node
        }
    }
}


const uiUpdater = new UIUpdater();
const tree = new AVLTree(uiUpdater);


function addValues() {
    const valueInput = document.getElementById('valueInput');
    const values = valueInput.value.split(/[\s,]+/).map(v => parseInt(v, 10)).filter(v => !isNaN(v));
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

function updateDimensions() {
    const margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = window.innerWidth - margin.right - margin.left - 40,
        height = window.innerHeight - margin.top - margin.bottom - 200;  // subtracting more to account for other UI elements

    d3.select("#tree-container svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom);
}

window.onresize = updateDimensions;

function printTraversals() {
    let preOrderResult = [];
    let inOrderResult = [];
    let postOrderResult = [];

    tree.printPreOrder(undefined,(value) => preOrderResult.push(value));
    tree.printInOrder(undefined,(value) => inOrderResult.push(value));
    tree.printPostOrder(undefined,(value) => postOrderResult.push(value));

    updateTraversalResults(preOrderResult, inOrderResult, postOrderResult);
}

function updateTraversalResults(preOrder, inOrder, postOrder) {
    const resultBox = document.getElementById('resultBox');
    resultBox.value = `Pre-order: ${preOrder}\nIn-order: ${inOrder.join(' ')}\nPost-order: ${postOrder.join(' ')}`;
}
