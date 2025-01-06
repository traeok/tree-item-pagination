import * as vscode from 'vscode';

export function activate(_context: vscode.ExtensionContext) {
	const treeProvider = new PaginatedTreeProvider();
  vscode.window.registerTreeDataProvider("tree-item-testing", treeProvider);
  vscode.commands.registerCommand("paginationSample.loadMore", async (callback: () => void | PromiseLike<void>) => {
    await callback();
  });
	return { treeProvider };
}

class PaginatedTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeItem | null | undefined>();
  public onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined = this._onDidChangeTreeDataEmitter.event;
  private data: TreeItem[] = [];
  private loadedItems = 0;
  private itemsPerPage = 100;
  private treeView: vscode.TreeView<TreeItem>;

  public constructor() {
	  this.loadMoreItems();
    this.treeView = vscode.window.createTreeView("tree-pagination", {
      treeDataProvider: this
    });
  }

  public getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  public loadMoreItems() {
    const newItems = Array.from({ length: this.itemsPerPage }, (_v, i) => {
      const id = this.data.length > 0 ? this.data.length - 1 + i : this.data.length + i; // -1 for the "load more items" item
      return new TreeItem(`Item ${id}`);
    });

    this.data = [...this.data.filter((it) => !(it instanceof LoadMoreTreeItem)), ...newItems];
    this.data.push(new LoadMoreTreeItem(this.loadMoreItems.bind(this)));
    this.loadedItems += this.itemsPerPage;
    this._onDidChangeTreeDataEmitter.fire(null);
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;

  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
  }
}

class LoadMoreTreeItem extends TreeItem {
  public constructor(callback: () => void | PromiseLike<void>) {
    super("Load more items...");
    this.command = {
      command: "paginationSample.loadMore",
      title: "Load more",
      arguments: [callback]
    };
  }
}