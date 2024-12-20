let zoomLevel = 1;  // Declare zoomLevel at the top
const zoomStep = 0.1;
let currentTransform = d3.zoomIdentity;

// Global variable to enable/disable animations
let animationsEnabled = true;

const zoom = d3.zoom().on("zoom", function (event) {
    currentTransform = event.transform;
    d3.select("#svg-content").attr("transform", currentTransform);
});

function wait(ms) {
    if (!animationsEnabled) {
        // If animations are disabled, return immediately
        return Promise.resolve();
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}

let pointer = null; // Pointer circle reference

function getNodePosition(key) {
    const nodes = d3.selectAll('g.node');
    let found = null;
    nodes.each(function(d) {
        if (d.data && d.data.key === key) {
            const node = d3.select(this);
            const transform = node.attr("transform");
            const match = /translate\(([^,]+),([^,]+)\)/.exec(transform);
            if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                found = {x,y};
            }
        }
    });
    return found;
}

async function highlightNode(key, color) {
    const nodes = d3.selectAll('g.node circle');
    const selection = nodes.filter(d => d.data.key === key);
    if (!animationsEnabled) {
        // No animation, set color instantly
        selection.style("fill", color);
        return;
    }
    selection.transition().duration(100)
        .style("fill", color);
    await wait(100);
}

async function revertNodeColor(key) {
    const nodes = d3.selectAll('g.node circle');
    const selection = nodes.filter(d => d.data.key === key);
    if (!animationsEnabled) {
        // No animation
        selection.style("fill", d => d._children ? "green" : "#fff");
        return;
    }
    selection.transition().duration(100)
        .style("fill", d => d._children ? "green" : "#fff");
    await wait(100);
}

async function showPointerAtNode(key, message) {
    appendStepMessage(message);
    if (!pointer) return; 
    const pos = getNodePosition(key);
    if (pos) {
        pointer.style("display", "block");
        if (!animationsEnabled) {
            pointer.attr("cx", pos.x)
                   .attr("cy", pos.y);
            return;
        }
        pointer.transition().duration(500)
            .attr("cx", pos.x)
            .attr("cy", pos.y);
        await wait(600); // Wait a bit after moving pointer
    }
}

function appendStepMessage(msg) {
    const stepsBox = document.getElementById('stepsBox');
    if (stepsBox) {
        const p = document.createElement('p');
        p.textContent = msg;
        stepsBox.appendChild(p);
        stepsBox.scrollTop = stepsBox.scrollHeight; // Auto scroll
    }
}

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
        this.reset();
    }

    reset() {
        this.leftRotations = 0;
        this.rightRotations = 0;
        this.leftRightRotations = 0;
        this.rightLeftRotations = 0;
        this.comparisons = 0;
        this.operationTime = 0;
        this.updateAllMetrics();
    }

    incrementCounter(counter) {
        this[counter]++;
        this.updateAllMetrics();
    }

    setOperationTime(time) {
        this.operationTime = time.toFixed(2);
        this.updateMetrics(['operation-time']);
    }

    updateMetrics(metrics) {
        metrics.forEach(metric => {
            document.getElementById(metric).textContent = this[metric.replace('-', '')];
        });
    }

    updateAllMetrics() {
        this.updateMetrics([
            'left-rotations', 
            'right-rotations', 
            'left-right-rotations', 
            'right-left-rotations', 
            'comparisons', 
            'operation-time'
        ]);
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

    async rotate(node, direction, reasonDetail) {
        appendStepMessage(`Imbalance detected at node ${node.key}. Highlighting before rotation...`);
        await showPointerAtNode(node.key, `Node ${node.key} needs a ${direction.toUpperCase()} rotation due to ${reasonDetail}.`);
        await highlightNode(node.key, "orange");
        if (animationsEnabled) {
            await wait(1500);
        }
        await revertNodeColor(node.key);

        const opposite = direction === 'left' ? 'right' : 'left';
        const temp = node[opposite];
        node[opposite] = temp[direction];
        temp[direction] = node;

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        temp.height = 1 + Math.max(this.height(temp.left), this.height(temp.right));
        this.uiUpdater.incrementCounter(`${direction}Rotations`);

        appendStepMessage(`Performing a ${direction.toUpperCase()} rotation on node ${node.key} due to ${reasonDetail}.`);
        
        // Re-render after rotation
        renderTree();
        
        await showPointerAtNode(temp.key, `Rotation completed. Now ${temp.key} is balanced here.`);
        await highlightNode(temp.key, "yellow");
        if (animationsEnabled) {
            await wait(1500);
        }
        await revertNodeColor(temp.key);

        return temp;
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

    async insert(node, key, parent = null) {
        this.uiUpdater.incrementCounter('comparisons');
        if (!node) {
            appendStepMessage(`Inserting key ${key}${parent ? ' under parent ' + parent.key : ' as root'}.`);
            this.history.unshift({ type: 'add', key, parent: parent ? parent.key : 'none', reason: 'Inserted as a new node' });
            return new AVLNode(key);
        }

        await showPointerAtNode(node.key, `Comparing ${key} with ${node.key}`);
        await highlightNode(node.key, "orange");
        if (animationsEnabled) {
            await wait(1500);
        }
        await revertNodeColor(node.key);

        if (key < node.key) {
            appendStepMessage(`Key ${key} < ${node.key}, going LEFT.`);
            node.left = await this.insert(node.left, key, node);
        } else if (key > node.key) {
            appendStepMessage(`Key ${key} > ${node.key}, going RIGHT.`);
            node.right = await this.insert(node.right, key, node);
        } else {
            appendStepMessage(`Key ${key} already exists. No insertion performed.`);
            return node; 
        }

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        const balance = this.getBalance(node);

        if (balance > 1) {
            if (key < node.left.key) {
                this.history.unshift({ type: 'rotation', key: node.key, rotation: 'right', reason: 'Left-Left case' });
                appendStepMessage(`Left-Left imbalance at ${node.key}, performing RIGHT rotation.`);
                return await this.rotate(node, 'right', 'Left-Left imbalance');
            }
            if (key > node.left.key) {
                node.left = await this.rotate(node.left, 'left', 'Left-Right inner step');
                this.uiUpdater.incrementCounter('leftRightRotations');
                this.history.unshift({ type: 'rotation', key: node.key, rotation: 'left-right', reason: 'Left-Right case' });
                appendStepMessage(`Left-Right imbalance at ${node.key}, performing LEFT-RIGHT rotation steps.`);
                return await this.rotate(node, 'right', 'Completing Left-Right imbalance');
            }
        }

        if (balance < -1) {
            if (key > node.right.key) {
                this.history.unshift({ type: 'rotation', key: node.key, rotation: 'left', reason: 'Right-Right case' });
                appendStepMessage(`Right-Right imbalance at ${node.key}, performing LEFT rotation.`);
                return await this.rotate(node, 'left', 'Right-Right imbalance');
            }
            if (key < node.right.key) {
                node.right = await this.rotate(node.right, 'right', 'Right-Left inner step');
                this.uiUpdater.incrementCounter('rightLeftRotations');
                this.history.unshift({ type: 'rotation', key: node.key, rotation: 'right-left', reason: 'Right-Left case' });
                appendStepMessage(`Right-Left imbalance at ${node.key}, performing RIGHT-LEFT rotation steps.`);
                return await this.rotate(node, 'left', 'Completing Right-Left imbalance');
            }
        }

        this.updateNodeDepthAndBalance(node);
        return node;
    }

    async addNode(key) {
        const startTime = performance.now();
        renderTree();
        if (this.root) {
            await showPointerAtNode(this.root.key, "Starting insertion at the root...");
        }
        this.root = await this.insert(this.root, key);
        const endTime = performance.now();
        this.uiUpdater.setOperationTime(endTime - startTime);
        this.updateHistory();
        renderTree();
        printTraversals();
    }

    search(node, key, path = []) {
        this.uiUpdater.incrementCounter('comparisons');
        if (!node) {
            this.history.unshift({ type: 'search', key, path: [...path], found: false });
            return null;
        }
        path.push(node.key);
        if (key === node.key) {
            this.history.unshift({ type: 'search', key, path: [...path], found: true });
            return node;
        }
        return key < node.key ? this.search(node.left, key, path) : this.search(node.right, key, path);
    }

    highlightSearchPath(key) {
        const path = [];
        let current = this.root;
        while (current) {
            path.push(current.key);
            if (key === current.key) {
                break;
            }
            if (key < current.key) current = current.left;
            else current = current.right;
        }
        this.updateSearchPath(path);
    }

    updateSearchPath(path) {
        const nodes = d3.selectAll('g.node');
        nodes.selectAll('circle')
            .style("fill", d => path.includes(d.data.key) ? "red" : (d._children ? "green" : "#fff"));
    }

    searchNode(key) {
        const startTime = performance.now();
        const result = this.search(this.root, key);
        const endTime = performance.now();
        this.uiUpdater.setOperationTime(endTime - startTime);
        this.highlightSearchPath(key);
        this.updateHistory();
        appendStepMessage(result ? `Key ${key} found in the tree.` : `Key ${key} not found in the tree.`);
        renderTree();
        return result;
    }

    deleteNode(key) {
        const startTime = performance.now();
        this.root = this.delete(this.root, key);
        const endTime = performance.now();
        this.uiUpdater.setOperationTime(endTime - startTime);
        this.updateHistory();
        renderTree();
        printTraversals();
    }

    async rotateForDeletion(node, direction, reasonDetail) {
        return await this.rotate(node, direction, reasonDetail);
    }

    delete(root, key, parent = null) {
        this.uiUpdater.incrementCounter('comparisons');
        if (!root) return root;

        appendStepMessage(`Comparing ${key} with ${root.key} for deletion.`);
        if (key < root.key) {
            appendStepMessage(`Key ${key} < ${root.key}, going LEFT for deletion.`);
            root.left = this.delete(root.left, key, root);
        } else if (key > root.key) {
            appendStepMessage(`Key ${key} > ${root.key}, going RIGHT for deletion.`);
            root.right = this.delete(root.right, key, root);
        } else {
            appendStepMessage(`Key ${key} found. Deleting node ${root.key}.`);
            if (!root.left || !root.right) {
                const deletedNode = root;
                root = root.left || root.right;
                this.history.unshift({ type: 'delete', key: deletedNode.key, parent: parent ? parent.key : 'none', reason: 'Node had one or no children' });
            } else {
                const temp = this.getMinValueNode(root.right);
                appendStepMessage(`Node ${root.key} has two children, using successor ${temp.key}.`);
                this.history.unshift({ type: 'delete', key: root.key, parent: parent ? parent.key : 'none', reason: 'Node had two children' });
                root.key = temp.key;
                root.right = this.delete(root.right, temp.key, root);
            }
        }

        if (!root) return root;

        root.height = 1 + Math.max(this.height(root.left), this.height(root.right));
        const balance = this.getBalance(root);

        if (balance > 1) {
            if (this.getBalance(root.left) >= 0) {
                appendStepMessage(`Left-Left imbalance at ${root.key} post-deletion, performing RIGHT rotation.`);
                return this.rotate(root, 'right', 'Left-Left after deletion');
            }
            appendStepMessage(`Left-Right imbalance at ${root.key} post-deletion, performing LEFT-RIGHT steps.`);
            root.left = this.rotate(root.left, 'left', 'Left-Right inner step after deletion');
            this.history.unshift({ type: 'rotation', key: root.key, rotation: 'left-right', reason: 'Left-Right case' });
            return this.rotate(root, 'right', 'Completing Left-Right after deletion');
        }

        if (balance < -1) {
            if (this.getBalance(root.right) <= 0) {
                appendStepMessage(`Right-Right imbalance at ${root.key} post-deletion, performing LEFT rotation.`);
                return this.rotate(root, 'left', 'Right-Right after deletion');
            }
            appendStepMessage(`Right-Left imbalance at ${root.key} post-deletion, performing RIGHT-LEFT steps.`);
            root.right = this.rotate(root.right, 'right', 'Right-Left inner step after deletion');
            this.history.unshift({ type: 'rotation', key: root.key, rotation: 'right-left', reason: 'Right-Left case' });
            return this.rotate(root, 'left', 'Completing Right-Left after deletion');
        }

        this.updateNodeDepthAndBalance(root);
        return root;
    }

    getMinValueNode(node) {
        let current = node;
        while (current && current.left) current = current.left;
        return current;
    }

    undoLastOperation() {
        const lastOperation = this.history.shift();
        if (!lastOperation) return;
        appendStepMessage(`Undoing last operation: ${lastOperation.type} on key ${lastOperation.key}.`);
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
            listItem.textContent = this.formatHistoryItem(operation);
            historyList.appendChild(listItem);
        });
    }

    formatHistoryItem(operation) {
        switch (operation.type) {
            case 'add':
                return `Added node ${operation.key} under parent ${operation.parent}. Reason: ${operation.reason}`;
            case 'delete':
                return `Deleted node ${operation.key} under parent ${operation.parent}. Reason: ${operation.reason}`;
            case 'rotation':
                return `Performed ${operation.rotation} rotation on node ${operation.key}. Reason: ${operation.reason}`;
            case 'search':
                return `Searched for ${operation.key}. Path: ${operation.path.join(' -> ')}. ${operation.found ? 'Found.' : 'Not found.'}`;
        }
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
        if (!node) return 0;
        return 1 + Math.max(this.getDepth(node.left), this.getDepth(node.right));
    }

    getComplexity(node = this.root) {
        if (!node) return 0;
        return 1 + this.getComplexity(node.left) + this.getComplexity(node.right);
    }
}

let uiUpdater = new UIUpdater();
let tree = new AVLTree(uiUpdater);

async function addValues() {
    const valueInput = document.getElementById('valueInput');
    const values = valueInput.value.split(/[\s,]+/).map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    if (values.length > 0) {
        for (const value of values) {
            await tree.addNode(value);
        }
        updateOperations('addValues', values);
        valueInput.value = '';
    } else {
        alert('Please enter valid numbers separated by commas or spaces.');
    }
}

function deleteValue() {
    const valueInput = document.getElementById('valueInput');
    const value = parseInt(valueInput.value, 10);
    if (!isNaN(value)) {
        tree.deleteNode(value);
        updateOperations('deleteValue', value);
        valueInput.value = '';
    } else {
        alert('Please enter a valid number.');
    }
}

function updateOperations(type, values) {
    let operations = localStorage.getItem('operations');
    operations = operations ? JSON.parse(operations) : [];
    operations.push({ type, values });
    localStorage.setItem('operations', JSON.stringify(operations));
}

function undoLastOperation() {
    tree.undoLastOperation();
}

function renderTree() {
    if (!tree.root) {
        d3.select("#tree-container").select("svg").remove();
        return;
    }

    const margin = { top: 20, right: 40, bottom: 150, left: 10 };
    const container = d3.select("#tree-container").node().getBoundingClientRect();
    const width = container.width - margin.right - margin.left;
    const height = container.height - margin.top - margin.bottom;

    d3.select("#tree-container").select("svg").remove();

    const svg = d3.select("#tree-container")
        .append("svg")
        .attr("width", container.width)
        .attr("height", container.height)
        .call(zoom)
        .append("g")
        .attr("id", "svg-content")
        .attr("transform", currentTransform);

    if (!pointer) {
        pointer = svg.append("circle")
            .attr("id", "pointer")
            .attr("r", 6)
            .style("fill", "red")
            .style("stroke", "black")
            .style("stroke-width", "1")
            .style("display", "none");
    }

    const treemap = d3.tree().size([height, width]);
    const rootHierarchy = d3.hierarchy(tree.root, d => [d.left, d.right].filter(d => d));
    rootHierarchy.x0 = height / 2;
    rootHierarchy.y0 = 0;

    let i = 0;
    const duration = animationsEnabled ? 750 : 0;

    function update(source) {
        const treeData = treemap(rootHierarchy);
        const nodes = treeData.descendants();
        const links = treeData.descendants().slice(1);

        nodes.forEach(d => d.y = d.depth * 100);

        const node = svg.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
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
            .style("font-size", "10px")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => `Depth: ${d.depth}`);

        nodeEnter.append('text')
            .attr("dy", "2em")
            .style("font-size", "10px")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .attr("paint-order", "stroke")
            .text(d => `Balance: ${tree.getBalance(d.data)}`);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodeUpdate.selectAll('text')
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("dy", (d, i) => ["-.5em", "1em", "2em"][i]);

        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", d => d._children ? "green" : "#fff")
            .attr('cursor', 'pointer');

        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.x},${source.y})`)
            .remove();

        nodeExit.select('circle').attr('r', 1e-6);
        nodeExit.select('text').style('fill-opacity', 1e-6);

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

        const linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', d => {
                const o = { x: source.x, y: source.y };
                return diagonal(o, o);
            })
            .remove();

        linkExit.select('circle').attr('r', 1e-6);
        linkExit.select('text').style('fill-opacity', 1e-6);

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function diagonal(s, d) {
            return `M ${s.x} ${s.y}
                C ${(s.x + d.x) / 2} ${s.y},
                ${(s.x + d.x) / 2} ${d.y},
                ${d.x} ${d.y}`;
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
    d3.select("#tree-container").select("svg").call(zoom.transform, currentTransform);
}

function updateDimensions() {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = window.innerWidth - margin.right - margin.left - 40;
    const height = window.innerHeight - margin.top - margin.bottom - 200;
    d3.select("#tree-container svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom);
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('valueInput').addEventListener('keypress', async function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            await addValues();
        }
    });
    document.getElementById('animationsCheckbox').addEventListener('change', function(e) {
        animationsEnabled = e.target.checked;
    });
    
    // Update the existing showWelcomeMessage function to sync the checkbox
    document.getElementById('toggle-animations').addEventListener('click', () => {
        animationsEnabled = !animationsEnabled;
        document.getElementById('animationsCheckbox').checked = animationsEnabled;
        document.getElementById('toggle-animations').textContent = 
            animationsEnabled ? "Disable Animations" : "Enable Animations";
    });
    if (!localStorage.getItem('visited')) {
        showWelcomeMessage();
    } else {
        loadZoomState();
    }
});

function showWelcomeMessage() {
    const modal = document.createElement('div');
    modal.classList.add('fixed', 'inset-0', 'bg-gray-800/50', 'flex', 'items-center', 'justify-center', 'z-50');
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center max-w-md mx-auto border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to the AVL Tree Visualizer!</h2>
            <p class="mb-4 text-gray-600 dark:text-gray-300">Experience AVL operations step-by-step with visual highlights and timed animations. You can disable animations to see the results instantly.</p>
            <div class="flex space-x-4 justify-center mt-4">
                <button id="welcome-ok" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">OK</button>
                <button id="toggle-animations" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Disable Animations</button>
            </div>
        </div>
    `;
    // document.body.appendChild(modal);

    // document.getElementById('welcome-ok').addEventListener('click', () => {
    //     modal.remove();
    //     localStorage.setItem('visited', 'true');
    //     loadZoomState();
    // });

    // document.getElementById('toggle-animations').addEventListener('click', () => {
    //     animationsEnabled = !animationsEnabled; 
    //     document.getElementById('toggle-animations').textContent = animationsEnabled ? "Disable Animations" : "Enable Animations";
    // });
}

function recenterTree() {
    currentTransform = d3.zoomIdentity;
    d3.select("#tree-container").select("svg").call(zoom.transform, currentTransform);
}

function saveZoomState() {
    const zoomState = {
        transform: currentTransform,
        zoomLevel: zoomLevel
    };
    localStorage.setItem('zoomState', JSON.stringify(zoomState));
}

function loadZoomState() {
    const savedZoomState = localStorage.getItem('zoomState');
    if (savedZoomState) {
        const { transform, zoomLevel: savedZoomLevel } = JSON.parse(savedZoomState);
        currentTransform = d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k);
        zoomLevel = savedZoomLevel;
    }
    renderTree();
}

function updateTreeStats() {
    document.getElementById('tree-depth').textContent = tree.getDepth();
    document.getElementById('tree-complexity').textContent = tree.getComplexity();
}

function printTraversals() {
    const preOrderResult = [];
    const inOrderResult = [];
    const postOrderResult = [];

    tree.printPreOrder(undefined, value => preOrderResult.push(value));
    tree.printInOrder(undefined, value => inOrderResult.push(value));
    tree.printPostOrder(undefined, value => postOrderResult.push(value));
    updateTraversalResults(preOrderResult, inOrderResult, postOrderResult);
    updateTreeStats();
}

function updateTraversalResults(preOrder, inOrder, postOrder) {
    const resultBox = document.getElementById('resultBox');
    if (resultBox) {
        resultBox.value = `Pre-order: ${preOrder}\nIn-order: ${inOrder.join(' ')}\nPost-order: ${postOrder.join(' ')}`;
    }
}

function resetTree() {
    tree = new AVLTree(uiUpdater);
    uiUpdater.reset();
    const resultBox = document.getElementById('resultBox');
    if (resultBox) resultBox.value = '';
    const valueInput = document.getElementById('valueInput');
    if (valueInput) valueInput.value = '';
    localStorage.removeItem('operations');
    localStorage.removeItem('zoomState');
    d3.select("#tree-container").select("svg").remove();
    tree.history = [];
    tree.updateHistory();
    appendStepMessage("Tree reset.");
}

function searchValue() {
    const valueInput = document.getElementById('valueInput');
    const value = parseInt(valueInput.value, 10);
    if (!isNaN(value)) {
        const result = tree.searchNode(value);
        alert(result ? `Node with key ${value} found.` : `Node with key ${value} not found.`);
        renderTree();
    } else {
        alert('Please enter a valid number.');
    }
}

function executeSavedOperations() {
    const savedOperations = localStorage.getItem('operations');
    if (savedOperations) {
        const operations = JSON.parse(savedOperations);
        (async () => {
            for (const op of operations) {
                if (op.type === 'addValues') {
                    for (const value of op.values) {
                        await tree.addNode(value);
                    }
                } else if (op.type === 'deleteValue') {
                    tree.deleteNode(op.values);
                }
            }
            renderTree();
        })();
    }
}

window.onload = async function () {
    uiUpdater = new UIUpdater();
    tree = new AVLTree(uiUpdater);
    executeSavedOperations();
    updateDimensions();
    printTraversals();
    updateTreeStats();
    renderTree();
};
