package AvlBaum.test;

public class AVLTree {
    AVLNode root;
    int leftRotations = 0;
    int rightRotations = 0;
    int leftRightRotations = 0;
    int rightLeftRotations = 0;

    int height(AVLNode N) {
        return (N == null) ? 0 : N.height;
    }

    AVLNode rightRotate(AVLNode y) {
        AVLNode x = y.left;
        AVLNode T = x.right;
        x.right = y;
        y.left = T;
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        rightRotations++;
        return x;
    }

    AVLNode leftRotate(AVLNode x) {
        AVLNode y = x.right;
        AVLNode T = y.left;
        y.left = x;
        x.right = T;
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        leftRotations++;
        return y;
    }

    int getBalance(AVLNode N) {
        return (N == null) ? 0 : height(N.left) - height(N.right);
    }

    AVLNode insert(AVLNode node, int key) {
        if (node == null)
            return (new AVLNode(key));
        if (key < node.key)
            node.left = insert(node.left, key);
        else if (key > node.key)
            node.right = insert(node.right, key);
        else
            return node;

        node.height = 1 + Math.max(height(node.left), height(node.right));
        int balance = getBalance(node);

        if (balance > 1 && key < node.left.key)
            return rightRotate(node);

        if (balance < -1 && key > node.right.key)
            return leftRotate(node);

        if (balance > 1 && key > node.left.key) {
            node.left = leftRotate(node.left);
            leftRightRotations++;
            return rightRotate(node);
        }

        if (balance < -1 && key < node.right.key) {
            node.right = rightRotate(node.right);
            rightLeftRotations++;
            return leftRotate(node);
        }

        return node;
    }

    void printPrefixExpression(AVLNode node) {
        if (node != null) {
            System.out.print(node.key + " ");
            printPrefixExpression(node.left);
            printPrefixExpression(node.right);
        }
    }

    void printInorder(AVLNode node) {
        if (node != null) {
            printInorder(node.left);
            System.out.print(node.key + " ");
            printInorder(node.right);
        }
    }

    void printPostorder(AVLNode node) {
        if (node != null) {
            printPostorder(node.left);
            printPostorder(node.right);
            System.out.print(node.key + " ");
        }
    }

    public static void main(String[] args) {
        AVLTree tree = new AVLTree();
        int[] values = {39, 7, 11, 72, 50, -17, 71, 70, 68, 14, 9, 94, 96};

        for (int value : values) {
            tree.root = tree.insert(tree.root, value);
        }

        System.out.println("Präfix Notation of constructed tree is : ");
        tree.printPrefixExpression(tree.root);

        System.out.println("\n\nInfix (In-order) traversal of constructed tree is : ");
        tree.printInorder(tree.root);

        System.out.println("\n\nPostfix (Post-order) traversal of constructed tree is : ");
        tree.printPostorder(tree.root);

        System.out.println("\n\nRotation Counts:");
        System.out.println("Left Rotations: " + tree.leftRotations);
        System.out.println("Right Rotations: " + tree.rightRotations);
        System.out.println("Left-Right Rotations: " + tree.leftRightRotations);
        System.out.println("Right-Left Rotations: " + tree.rightLeftRotations);
    }

}
