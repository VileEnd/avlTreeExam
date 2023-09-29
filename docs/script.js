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


let uiUpdater = new UIUpdater();
let tree = new AVLTree(uiUpdater);
let allNumbers = [];


function addValues() {
    const valueInput = document.getElementById('valueInput');
    const values = valueInput.value.split(/[\s,]+/).map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    if (values.length > 0) {
        values.forEach(value => {
            tree.addNode(value);
        });

        let operations = localStorage.getItem('operations');
        operations = operations ? JSON.parse(operations) : [];
        operations.push({type: 'addValues', values: values});
        localStorage.setItem('operations', JSON.stringify(operations));

        valueInput.value = '';
        renderTree();
        printTraversals()

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

    const treemap = d3.tree().size([height, width]);

    const rootHierarchy = d3.hierarchy(tree.root, d => [d.left, d.right].filter(d => d));
    rootHierarchy.x0 = height / 2;
    rootHierarchy.y0 = 0;

    let i = 0;
    const duration = 750;

    update(rootHierarchy);

    function update(source) {
        const treeData = treemap(rootHierarchy);
        const nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);

        nodes.forEach(d => d.y = d.depth * 100);

        const node = svg.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => `translate(${source.y0},${source.x0})`);

        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff");

        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.key);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff")
            .attr('cursor', 'pointer');

        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.x},${source.y})`)
            .remove();

        nodeExit.select('circle')
            .attr('r', 1e-6);

        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        const link = svg.selectAll('path.link')
            .data(links, d => d.id);

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal(o, o);
            });

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .duration(duration)
            .attr('d', d => diagonal(d, d.parent));

        link.exit().transition()
            .duration(duration)
            .attr('d', d => {
                const o = {x: source.x, y: source.y};
                return diagonal(o, o);
            })
            .remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function diagonal(s, d) {
            const path = `M ${s.x} ${s.y}
                C ${(s.x + d.x) / 2} ${s.y},
                ${(s.x + d.x) / 2} ${d.y},
                ${d.x} ${d.y}`;
            return path;
        }
    }
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
function resetTree() {
    tree = new AVLTree(uiUpdater);
    uiUpdater = new UIUpdater();
    uiUpdater.updateRotationCount();
    document.getElementById('resultBox').value = '';
    document.getElementById('valueInput').value = '';

    // Remove the existing SVG to clear the displayed tree
    d3.select("#tree-container").select("svg").remove();

    // Clear the operations from local storage
    localStorage.removeItem('operations');
}

function executeSavedOperations() {
    const savedOperations = localStorage.getItem('operations');
    if (savedOperations) {
        const operations = JSON.parse(savedOperations);
        operations.forEach(op => {
            if (op.type === 'addValues') {
                op.values.forEach(value => {
                    tree.addNode(value);
                });
            }
        });
        renderTree();  // Re-render the tree
    }
}
window.onload = function() {
    uiUpdater = new UIUpdater();
    tree = new AVLTree(uiUpdater);
    executeSavedOperations();
    updateDimensions();
    printTraversals()
}