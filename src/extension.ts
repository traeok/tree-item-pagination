import * as vscode from "vscode";

class PaginatedTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  // Total number of items (for demonstration)
  private treeView: vscode.TreeView<TreeItem>;
  private root: TreeItem;

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor() {
    this.treeView = vscode.window.createTreeView("tree-pagination", {
      treeDataProvider: this
    });
    this.root = new TreeItem("Sample Folder", this, vscode.TreeItemCollapsibleState.Collapsed);
  }

  public onTreeDataChanged() {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: TreeItem): TreeItem[] {
    if (!element) {
      return [this.root];
    } else if (element == this.root) {
      return this.root.getChildren(true);
    }

    return [];
  }
}

class TreeItem extends vscode.TreeItem {
  private totalItems = 1000;
  private itemsPerPage = 25;
  private currentPage = 0;

  constructor(label: string, private treeProvider: PaginatedTreeProvider, collapsibleState = vscode.TreeItemCollapsibleState.None) {
    super(label, collapsibleState);
  }

  private previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.treeProvider.onTreeDataChanged();
    }
  }

  private nextPage(): void {
    const maxPage = Math.ceil(this.totalItems / this.itemsPerPage) - 1;
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.treeProvider.onTreeDataChanged();
    }
  }

  public getChildren(paginate?: boolean): TreeItem[] {
    if (paginate) {
      return this.getPaginatedItems();
    }
    
    return [];
  }

  private getPaginatedItems(): TreeItem[] {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalItems);

    const items: TreeItem[] = [];

    // Add "Previous page" item if not on the first page
    if (this.currentPage > 0) {
      items.push(new NavigationTreeItem("Previous page", "arrow-small-left", this.treeProvider, () => this.previousPage()));
    }

    for (let i = startIndex; i < endIndex; i++) {
      items.push(new TreeItem(`Item ${i + 1}`, this.treeProvider));
    }

    // Add "Next page" item if not on the last page
    if (endIndex < this.totalItems) {
      items.push(new NavigationTreeItem("Next page", "arrow-small-right", this.treeProvider, () => this.nextPage()));
    }

    return items;
  }
}

class NavigationTreeItem extends TreeItem {
  constructor(label: string, icon: string, treeProvider: PaginatedTreeProvider, navigateCallback: () => void) {
    super(label, treeProvider);
    this.iconPath = new vscode.ThemeIcon(icon);
    this.command = {
      command: "paginationSample.navigate",
      title: label,
      arguments: [navigateCallback],
    };
  }
}

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new PaginatedTreeProvider();
  vscode.window.registerTreeDataProvider("paginationView", treeProvider);

  vscode.commands.registerCommand("paginationSample.navigate", (callback: () => void) => {
    callback();
  });
}

export function deactivate() {}
