class AVLNode {
    constructor(key) {
        this.key = key;
        this.height = 1;
        this.left = null;
        this.right = null;
        this.depth = 0;
        this.balance = 0;
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

    incrementLeftRightRotations() {
        this.leftRightRotations++;
        this.updateRotationCount();
    }

    incrementRightLeftRotations() {
        this.rightLeftRotations++;
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
        this.uiUpdater = uiUpdater;
        this.history = [];
    }

    height(node) {
        return node ? node.height : 0;
    }

    rightRotate(y) {
        const x = y.left;
        y.left = x.right;
        x.right = y;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        this.uiUpdater.incrementRightRotations();
        return x;
    }

    leftRotate(x) {
        const y = x.right;
        x.right = y.left;
        y.left = x;
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        this.uiUpdater.incrementLeftRotations();
        return y;
    }

    getBalance(node) {
        return node ? this.height(node.left) - this.height(node.right) : 0;
    }

    updateNodeDepthAndBalance(node) {
        if (node) {
            node.depth = Math.max(this.getNodeDepth(node.left), this.getNodeDepth(node.right)) + 1;
            node.balance = this.getBalance(node);
            this.updateNodeDepthAndBalance(node.left);
            this.updateNodeDepthAndBalance(node.right);
        }
    }

    getNodeDepth(node) {
        return node ? node.depth : -1;
    }

    insert(node, key, parent = null) {
        if (!node) {
            this.history.push({ type: 'add', key: key, parent: parent ? parent.key : 'none', reason: 'Inserted as a new node' });
            return new AVLNode(key);
        }
        if (key < node.key) {
            node.left = this.insert(node.left, key, node);
        } else if (key > node.key) {
            node.right = this.insert(node.right, key, node);
        } else {
            return node;
        }

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        const balance = this.getBalance(node);

        if (balance > 1 && key < node.left.key) {
            this.history.push({ type: 'rotation', key: node.key, rotation: 'right', reason: 'Left-Left case' });
            return this.rightRotate(node);
        }

        if (balance < -1 && key > node.right.key) {
            this.history.push({ type: 'rotation', key: node.key, rotation: 'left', reason: 'Right-Right case' });
            return this.leftRotate(node);
        }

        if (balance > 1 && key > node.left.key) {
            node.left = this.leftRotate(node.left);
            this.uiUpdater.incrementLeftRightRotations();
            this.history.push({ type: 'rotation', key: node.key, rotation: 'left-right', reason: 'Left-Right case' });
            return this.rightRotate(node);
        }

        if (balance < -1 && key < node.right.key) {
            node.right = this.rightRotate(node.right);
            this.uiUpdater.incrementRightLeftRotations();
            this.history.push({ type: 'rotation', key: node.key, rotation: 'right-left', reason: 'Right-Left case' });
            return this.leftRotate(node);
        }

        this.updateNodeDepthAndBalance(node);
        return node;
    }

    addNode(key) {
        this.root = this.insert(this.root, key);
        this.updateHistory();
    }

    search(node, key, path = []) {
        if (!node) {
            this.history.push({ type: 'search', key: key, path: [...path], found: false });
            return null;
        }
        path.push(node.key);
        if (key === node.key) {
            this.history.push({ type: 'search', key: key, path: [...path], found: true });
            return node;
        }
        if (key < node.key) {
            return this.search(node.left, key, path);
        } else {
            return this.search(node.right, key, path);
        }
    }

    searchNode(key) {
        const result = this.search(this.root, key);
        this.highlightSearchPath(key);
        this.updateHistory();
        return result;
    }

    highlightSearchPath(key) {
        const path = [];
        let current = this.root;
        while (current) {
            path.push(current.key);
            if (key === current.key) {
                break;
            }
            if (key < current.key) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        this.updateSearchPath(path);
    }

    updateSearchPath(path) {
        const nodes = d3.selectAll('g.node');
        nodes.selectAll('circle')
            .style("fill", d => path.includes(d.data.key) ? "red" : (d._children ? "green" : "#fff"));
    }

    deleteNode(key) {
        this.root = this.delete(this.root, key);
        this.updateHistory();
    }

    delete(root, key, parent = null) {
        if (!root) return root;

        if (key < root.key) {
            root.left = this.delete(root.left, key, root);
        } else if (key > root.key) {
            root.right = this.delete(root.right, key, root);
        } else {
            if (!root.left || !root.right) {
                const deletedNode = root;
                root = root.left ? root.left : root.right;
                this.history.push({ type: 'delete', key: deletedNode.key, parent: parent ? parent.key : 'none', reason: 'Node had one or no children' });
            } else {
                const temp = this.getMinValueNode(root.right);
                this.history.push({ type: 'delete', key: root.key, parent: parent ? parent.key : 'none', reason: 'Node had two children' });
                root.key = temp.key;
                root.right = this.delete(root.right, temp.key, root);
            }
        }

        if (!root) return root;

        root.height = 1 + Math.max(this.height(root.left), this.height(root.right));
        const balance = this.getBalance(root);

        if (balance > 1 && this.getBalance(root.left) >= 0) {
            this.history.push({ type: 'rotation', key: root.key, rotation: 'right', reason: 'Left-Left case' });
            return this.rightRotate(root);
        }

        if (balance > 1 && this.getBalance(root.left) < 0) {
            root.left = this.leftRotate(root.left);
            this.history.push({ type: 'rotation', key: root.key, rotation: 'left-right', reason: 'Left-Right case' });
            return this.rightRotate(root);
        }

        if (balance < -1 && this.getBalance(root.right) <= 0) {
            this.history.push({ type: 'rotation', key: root.key, rotation: 'left', reason: 'Right-Right case' });
            return this.leftRotate(root);
        }

        if (balance < -1 && this.getBalance(root.right) > 0) {
            root.right = this.rightRotate(root.right);
            this.history.push({ type: 'rotation', key: root.key, rotation: 'right-left', reason: 'Right-Left case' });
            return this.leftRotate(root);
        }

        this.updateNodeDepthAndBalance(root);
        return root;
    }

    getMinValueNode(node) {
        let current = node;
        while (current.left) current = current.left;
        return current;
    }

    undoLastOperation() {
        const lastOperation = this.history.pop();
        if (!lastOperation) return;

        if (lastOperation.type === 'add') {
            this.root = this.delete(this.root, lastOperation.key);
        } else if (lastOperation.type === 'delete') {
            this.root = this.insert(this.root, lastOperation.key);
        }

        this.updateHistory();
        renderTree();
        printTraversals();
    }

    updateHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        this.history.forEach(operation => {
            const listItem = document.createElement('li');
            if (operation.type === 'add') {
                listItem.textContent = `Added node with key ${operation.key} under parent ${operation.parent}. Reason: ${operation.reason}`;
            } else if (operation.type === 'delete') {
                listItem.textContent = `Deleted node with key ${operation.key} under parent ${operation.parent}. Reason: ${operation.reason}`;
            } else if (operation.type === 'rotation') {
                listItem.textContent = `Performed ${operation.rotation} rotation on node with key ${operation.key}. Reason: ${operation.reason}`;
            } else if (operation.type === 'search') {
                listItem.textContent = `Searched for node with key ${operation.key}. Path: ${operation.path.join(' -> ')}. ${operation.found ? 'Node found.' : 'Node not found.'}`;
            }
            historyList.appendChild(listItem);
        });
    }

    printPreOrder(node = this.root, logger = console.log) {
        if (node) {
            logger(node.key);
            this.printPreOrder(node.left, logger);
            this.printPreOrder(node.right, logger);
        }
    }

    printInOrder(node = this.root, logger = console.log) {
        if (node) {
            this.printInOrder(node.left, logger);
            logger(node.key + " ");
            this.printInOrder(node.right, logger);
        }
    }

    printPostOrder(node = this.root, logger = console.log) {
        if (node) {
            this.printPostOrder(node.left, logger);
            this.printPostOrder(node.right, logger);
            logger(node.key + " ");
        }
    }

    getDepth(node = this.root) {
        if (node == null) {
            return 0;
        }
        const leftDepth = this.getDepth(node.left);
        const rightDepth = this.getDepth(node.right);
        return Math.max(leftDepth, rightDepth) + 1;
    }

    getComplexity(node = this.root) {
        if (node == null) {
            return 0;
        }
        const leftComplexity = this.getComplexity(node.left);
        const rightComplexity = this.getComplexity(node.right);
        return leftComplexity + rightComplexity + 1;
    }
}

let uiUpdater = new UIUpdater();
let tree = new AVLTree(uiUpdater);

function addValues() {
    const valueInput = document.getElementById('valueInput');
    const values = valueInput.value.split(/[\s,]+/).map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    if (values.length > 0) {
        values.forEach(value => {
            tree.addNode(value);
        });

        let operations = localStorage.getItem('operations');
        operations = operations ? JSON.parse(operations) : [];
        operations.push({ type: 'addValues', values: values });
        localStorage.setItem('operations', JSON.stringify(operations));

        valueInput.value = '';
        renderTree();
        printTraversals();
    } else {
        alert('Please enter a valid number or list of numbers, separated by commas or spaces.');
    }
}

function deleteValue() {
    const valueInput = document.getElementById('valueInput');
    const value = parseInt(valueInput.value, 10);
    if (!isNaN(value)) {
        tree.deleteNode(value);

        let operations = localStorage.getItem('operations');
        operations = operations ? JSON.parse(operations) : [];
        operations.push({ type: 'deleteValue', value: value });
        localStorage.setItem('operations', JSON.stringify(operations));

        valueInput.value = '';
        renderTree();
        printTraversals();
    } else {
        alert('Please enter a valid number.');
    }
}

function undoLastOperation() {
    tree.undoLastOperation();
}

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function renderTree() {
    if (!tree.root) {
        return;
    }

    const margin = { top: 20, right: 40, bottom: 150, left: 10 },
        container = d3.select("#tree-container").node().getBoundingClientRect(),
        width = container.width - margin.right - margin.left,
        height = container.height - margin.top - margin.bottom;

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
            .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
            .on('click', click);

        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", d => d._children ? "lightsteelblue" : "#a09393")
            .attr("stroke", "#002bc5");

        nodeEnter.append('text')
            .attr("dy", "-1em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .style("font-size", "15px")
            .attr("paint-order", "stroke")
            .text(d => d.data.key);

        nodeEnter.append('text')
            .attr("dy", "1em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .style("font-size", "10px")
            .text(d => `Depth: ${d.depth}`);

        nodeEnter.append('text')
            .attr("dy", "2em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .style("font-size", "10px")
            .attr("paint-order", "stroke")
            .text(d => `Balance: ${tree.getBalance(d.data)}`);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodeUpdate.selectAll('text')
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("dy", (d, i) => {
                switch (i) {
                    case 0: return "-.5em";
                    case 1: return "1em";
                    case 2: return "2em";
                }
            });

        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", d => d._children ? "green" : "#fff")
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
                const o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            });

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d, d.parent))
        .attr("fill", "none")
        .style('stroke', 'lightsteelblue')
        .attr("stroke-width", 2);

    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", d => d._children ? "green" : "#fff") // Reset node colors
        .attr('cursor', 'pointer');

    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', d => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    linkExit.select('circle')
        .attr('r', 1e-6);

    linkExit.select('text')
        .style('fill-opacity', 1e-6);

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

    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
}

update(rootHierarchy);
}

function updateDimensions() {
const margin = { top: 20, right: 20, bottom: 20, left: 20 },
    width = window.innerWidth - margin.right - margin.left - 40,
    height = window.innerHeight - margin.top - margin.bottom - 200;
d3.select("#tree-container svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);
}

window.onresize = () => {
updateDimensions();
renderTree();
};

function updateTreeStats() {
const treeDepth = tree.getDepth();
const treeComplexity = tree.getComplexity();

document.getElementById('tree-depth').textContent = treeDepth;
document.getElementById('tree-complexity').textContent = treeComplexity;
}

function printTraversals() {
let preOrderResult = [];
let inOrderResult = [];
let postOrderResult = [];

tree.printPreOrder(undefined, value => preOrderResult.push(value));
tree.printInOrder(undefined, value => inOrderResult.push(value));
tree.printPostOrder(undefined, value => postOrderResult.push(value));
updateTraversalResults(preOrderResult, inOrderResult, postOrderResult);
updateTreeStats();
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

d3.select("#tree-container").select("svg").remove();

localStorage.removeItem('operations');
tree.history = [];
tree.updateHistory();
}

function searchValue() {
const valueInput = document.getElementById('valueInput');
const value = parseInt(valueInput.value, 10);
if (!isNaN(value)) {
    const result = tree.searchNode(value);
    if (result) {
        alert(`Node with key ${value} found.`);
    } else {
        alert(`Node with key ${value} not found.`);
    }
} else {
    alert('Please enter a valid number.');
}
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
        } else if (op.type === 'deleteValue') {
            tree.deleteNode(op.value);
        }
    });
    renderTree();
}
}

document.addEventListener('DOMContentLoaded', () => {
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeIcon = document.getElementById('dark-mode-icon');

// Check for saved user preference, if any, on load of the website
if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark');
    darkModeIcon.classList.add('text-gray-200');
    darkModeIcon.classList.remove('text-gray-800');
}

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('dark-mode', 'enabled');
        darkModeIcon.classList.add('text-gray-200');
        darkModeIcon.classList.remove('text-gray-800');
    } else {
        localStorage.setItem('dark-mode', 'disabled');
        darkModeIcon.classList.add('text-gray-800');
        darkModeIcon.classList.remove('text-gray-200');
    }
});
});

window.onload = function () {
uiUpdater = new UIUpdater();
tree = new AVLTree(uiUpdater);
executeSavedOperations();
updateDimensions();
printTraversals();
updateTreeStats();
};