// external modules
import inquirer from 'inquirer'
import chalk from 'chalk'

// core modules
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs'

operation()

function operation() {
 
    inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'O que deseja fazer?',
        choices: [
            'Criar conta',
            'Consultar saldo',
            'Depositar',
            'Sacar',
            'Transferência',
            'Sair'
        ]
    }])
    .then((answer) => {

        const action = answer['action']
        
        if (action === 'Criar conta') {
            createAccount()
        } else if (action === 'Consultar saldo') {
            consult()
        } else if (action === 'Depositar') {
            deposit()
        } else if (action === 'Sacar') {
            withdraw()
        } else if(action === 'Transferência') {
            transfer()
        } else if (action === 'Sair') {
            console.log(chalk.bgBlue.black('Obrigado por usar o Account!'))
            process.exit()
        }
        
    })
    .catch((err) => console.log(err))
}

// create an account
function createAccount() {

    console.log(chalk.bgGreen.black(`Parabéns por escolher o nosso banco!`))
    console.log(chalk.green(`Defina as opções da sua conta a seguir`))
    buildAccount()
}

function buildAccount() {

    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Digite o nome da sua conta: '
        }
    ])
    .then((answer) => {

        const accountName = answer['accountName']

        if(!existsSync('account')) {
            mkdirSync('account')
        }

        if(existsSync(`account/${accountName}.json`)) {
            console.log(chalk.bgRed.black('Esta conta já existe, escolha outro nome!'))
            buildAccount()
            return // para não ser executado repetidamente
        }

        writeFileSync(
            `account/${accountName}.json`,
            '{"balance": 0}',
            function(err) {
                console.log(err)
            }
        )

        console.log(chalk.green('Parabéns a sua conta foi criada!'))
        operation()

    })
    .catch((err) => console.log(err))
}

// add an amount to user account
function deposit() {

    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da sua conta?',
        }
    ])
    .then((answer) => {

        const accountName = answer['accountName']
    
        if (noAccountsExist()) {
            return operation()
        }

        if(!checkAccount(accountName)) {
            return deposit()
        }

        inquirer.prompt([
            {
                name: 'amount',
                message: 'Quanto você deseja depositar?',
            }
        ])
        .then((answer) => {

            const amount = answer['amount']

            addAmount(accountName, amount)
            operation()
    
        })
        .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))

}

// add value to the account
function addAmount(accountName, amount) {

    const account = getAccount(accountName)
    
    if(isNaN(amount) || amount <= 0) {
        console.log(chalk.bgRed.black('Valor inválido! Siga as diretrizes de depósito.'))
        return
    }

    amount = Number(amount)
    account.balance += amount
    console.log(chalk.bgGreen.bold(`Seu depósito de ${amount}$ foi realizado com sucesso!`))

    //save the updated account back to the file
    writeFileSync(`account/${accountName}.json`, JSON.stringify(account), function(err) {
        console.log(err)
    })

}

// remove an amount in the user's account
function withdraw() {

    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da sua conta?'
        }
    ])
    .then((answer) => {

        const accountName = answer['accountName']

        if(noAccountsExist()) {
            return createAccount()
        } 
        
        if(!checkAccount(accountName)) {
            return withdraw()
        }
           
        inquirer.prompt([
            {
                name: 'amount',
                message: 'Quanto você deseja sacar?',
            }
        ])
        .then((answer) => {

            const amount = answer['amount']
            
            //remove an amount
            removeAmount(accountName, amount)

            operation()

        })
        .catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))

}

// remove value to the account
function removeAmount(accountName, amount) {

    const account = getAccount(accountName)

    if(isNaN(amount) || amount <= 0) {
        console.log(chalk.bgRed.black('Valor inválido! Siga as diretrizes de depósito.'))
        return
    }

    amount = Number(amount)
    if(account.balance >= amount) {

        account.balance -= amount
        console.log(chalk.bgGreen.bold(`Seu saque de ${amount}$ foi realizado com sucesso!`))

    } else {
        console.log(chalk.bgRed.bold(`Seu saldo é insuficiente!`))
    }

    //save the updated account back to the file
    writeFileSync(`account/${accountName}.json`, JSON.stringify(account), function(err) {
        console.log(err)
    })

}

//check account balance
function consult() {

    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da sua conta?'
        }
    ])
    .then((answer) => {

        const accountName = answer['accountName']

        if(noAccountsExist()) {
            return createAccount()
        } 

        if(!checkAccount(accountName)) {
            return consult()
        }

        const account = getAccount(accountName)
        console.log(chalk.bgGreen.bold(`Seu saldo no banco é de ${account.balance}$`))

        operation()

    })
    .catch((err) => console.log(err))

}

function transfer() {

    inquirer.prompt([
        {
            name: 'originAccount',
            message: 'Qual o nome da sua conta de origem?'
        }
    ])
    .then((answer) => {

        const originAccount = answer['originAccount']

        if(noAccountsExist()) {
            return createAccount()
        } 

        if(!checkAccount(originAccount)) {
            return operation()
        }

        inquirer.prompt([
            {
                name: 'amount',
                message: 'Quanto você deseja tranferir?',
            }
        ])
        .then((answer) => {

            const amount = Number(answer['amount'])

            if (isNaN(amount) || amount <= 0) {
                console.log(chalk.bgRed.black('Valor inválido! Siga as diretrizes de transferência.'))
                return transfer()
            }

            const originAccData = getAccount(originAccount)

            if (originAccData.balance < amount) {
                console.log(chalk.bgRed.black('Saldo insuficiente na conta de origem.'))
                return transfer()
            }

            inquirer.prompt([
                {
                    name: 'targetAccount',
                    message: 'Qual o nome da conta de destino?'
                }
            ])
            .then((answer) => {
    
                const targetAccount = answer['targetAccount']
        
                if(!checkAccount(targetAccount)) {
                    console.log(chalk.bgRed.black(`Conta de destino não existe.`))
                    return operation()
                }

                const targetAccData = getAccount(targetAccount)
    
                //performs the transfer
                performsTransfer(originAccData, targetAccData, amount)

                writeFileSync(`account/${originAccount}.json`, JSON.stringify(originAccData), function(err) {
                    if (err) console.log(err)
                })
            
                writeFileSync(`account/${targetAccount}.json`, JSON.stringify(targetAccData), function(err) {
                    if (err) console.log(err)
                })
            
                console.log(chalk.bgGreen.bold(`Transferência de ${amount}$ de ${originAccount} para ${targetAccount} realizada com sucesso!`))

                operation()
    
            })
            .catch((err) => console.log(err))

        })
        .catch((err) => console.log(err))

    })
    .catch((err) => console.log(err))

}

function performsTransfer(origin, target, amount) {

    origin.balance -= amount
    target.balance += amount

}

//reads a JSON file and converts it to object
function getAccount(accountName) {
    const accountJSON = readFileSync(`account/${accountName}.json`, {
        encoding: 'utf8',
        flag: 'r',
    })
    
    return JSON.parse(accountJSON)
}

// verify if account exists
function checkAccount(accountName) {

    if(!existsSync(`account/${accountName}.json`)) {
        console.log(chalk.bgRed.black(`Esta conta não existe, escolha outro nome`))
        return false
    } 
    
    return true

}

// check that no account exists
function noAccountsExist() {
    if (!existsSync('account')) {
        mkdirSync('account')
        console.log(chalk.bgYellow.black('Esta conta não existe, crie uma conta'))
        return true
    }
    
    const files = readdirSync('account')
    
    if (files.length === 0) {
        console.log(chalk.bgYellow.black('Esta conta não existe, crie uma conta'))
        return true
    }
    
    return false
}
