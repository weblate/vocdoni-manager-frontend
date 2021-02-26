import React, { Component, ReactNode } from 'react'

import i18n from '../../i18n'
import { IWallet } from '../../lib/types'
import LoginContext from '../contexts/LoginContext'
import Ficon from '../ficon'

type State = {
    wallets: IWallet[],
}

export default class SelectAccount extends Component<Record<string, unknown>, State> {
    static contextType = LoginContext
    context !: React.ContextType<typeof LoginContext>

    state : State = {
        wallets: [],
    }

    async componentDidMount() : Promise<void> {
        try {
            const wallets = await this.context.web3Wallet.getStored();

            this.setState({wallets})
        } catch (err) {
            console.error(err)
        }
    }

    render() : ReactNode {
        return (
            <div className='account-selection'>
                <h5 className='text-center text-lg font-normal text-gray-500'>
                    {i18n.t('title.select_account')}
                </h5>
                <ul>
                    {
                        this.state.wallets.map((wallet, key) => (
                            <li key={key}>
                                <a onClick={this.context.accountSelect.bind(this, wallet.publicKey)}>
                                    {wallet.name}
                                </a>
                            </li>
                        ))
                    }
                </ul>
                <ul>
                    <li><a>
                        <Ficon icon='Plus' /> {i18n.t('btn.new_organization')}
                    </a></li>
                    <li><a>
                        <Ficon icon='LogOut' /> {i18n.t('btn.recover_account')}
                    </a></li>
                </ul>
            </div>
        )
    }
}
