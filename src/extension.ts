// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";

export async function trconfig() {
  let config = await vscode.workspace.getConfiguration();

  return config;
}

export async function GetTranlateFiles() {
  let rootpath: any = undefined;
  let excluded: any = undefined;
  const config = await trconfig();
  if (config !== undefined) {
    rootpath = config.get<string>("transloco.jsonrootfolder");
    excluded = config.get<string>("transloco.excludefolders");
  }

  if (rootpath === "" || rootpath === undefined) {
    rootpath = "**/assets/i18n/**/*.json";
  }

  if (excluded === "" || excluded === undefined) {
    excluded = "{dist,node_modules}";
  }

  let files = await vscode.workspace.findFiles(rootpath, excluded);

  let pr = files.map(u => {
    return u.fsPath;
  });

  return pr;
}

export async function PickKey(file: string) {
  let dopick: any = true;

  const config = await trconfig();
  if (config !== undefined) {
    dopick = config.get<boolean>("transloco.selectfirstlevelobjectkeys");
  }

  if (dopick === undefined) {
    dopick = true;
  }

  if (dopick) {
    let mainobj = JSON.parse(fs.readFileSync(file).toString());
    if (mainobj) {
      let keys = Object.keys(mainobj);
      let picked2 = await vscode.window.showQuickPick(keys, {
        canPickMany: false
      });
      if (picked2 === undefined) {
        picked2 = "";
      }
      return picked2;
    } else {
      return "";
    }
  }

  return "";
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "translococtx" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.transLocate",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(editor.selection);

        if (text && text !== "") {
          let ffiles = await GetTranlateFiles();
          let picked = await vscode.window.showQuickPick(ffiles, {
            canPickMany: true
          });

          if (picked) {
            let key = await PickKey(picked[0]);
            let txt = text.split(" ").join("_");
            const newtext = `{{t('${txt}')}}`;

            editor.edit(builder => builder.replace(selection, newtext));
            picked.map(o => {
              fs.readFile(o, (err, data) => {
                if (!err) {
                  let json = JSON.parse(data.toString());
                  if (key !== undefined && key !== null && key !== "") {
                    json[key][txt] = `${text}`;
                  } else {
                    json[txt] = `${text}`;
                  }

                  fs.writeFile(o, JSON.stringify(json), err1 => {
                    if (err1) {
                      vscode.window.showInformationMessage(err1.message);
                    }
                  });
                } else {
                  vscode.window.showInformationMessage(err.message);
                }
              });
            });
          }
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
