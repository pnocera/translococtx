// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";

export function trconfig() {
  let config = vscode.workspace.getConfiguration("translococtx");

  return config;
}

export function GetTranlateFiles() {
  let rootpath: any = undefined;
  const config = trconfig();
  if (config !== undefined) {
    rootpath = config.get<string>("transloco.jsonrootfolder");
  }

  if (rootpath === "" || rootpath === undefined) {
    rootpath = "**/assets/i18n/**/*.json";
  }

  let pr = vscode.workspace.findFiles(rootpath).then(obj => {
    return obj.map(u => {
      return u.fsPath;
    });
  });
  return Promise.resolve(pr);
}

export function PickKey(file: string) {
  let dopick: any = true;

  const config = trconfig();
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
      vscode.window
        .showQuickPick(keys, { canPickMany: false })
        .then(picked2 => {
          return Promise.resolve(picked2);
        });
    } else {
      return Promise.resolve("");
    }
  }

  return Promise.resolve("");
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
    () => {
      // The code you place here will be executed every time your command is executed
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(editor.selection);
        if (text && text !== "") {
          GetTranlateFiles().then(ffiles => {
            vscode.window
              .showQuickPick(ffiles, { canPickMany: true })
              .then(picked => {
                if (picked) {
                  PickKey(picked[0]).then(key => {
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
                              vscode.window.showInformationMessage(
                                err1.message
                              );
                            }
                          });
                        } else {
                          vscode.window.showInformationMessage(err.message);
                        }
                      });
                    });
                  });
                }
              });
          });
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
