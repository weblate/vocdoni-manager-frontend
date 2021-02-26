import React, { Component, ReactNode } from 'react'
import { Else, If, Then } from 'react-if'
import i18n from '../../i18n'

import { IWallet } from '../../lib/types'
import LoginContext from '../contexts/LoginContext'
import Ficon from '../ficon'
import SelectAccount from './SelectAccount'

type State = {
    selected: IWallet,
    password: string,
}

export default class EntityLogin extends Component<Record<string, unknown>, State> {
    static contextType = LoginContext
    context !: React.ContextType<typeof LoginContext>

    state : State = {
        selected: null,
        password: null,
    }

    async componentDidMount() : Promise<void> {
        const selected = localStorage.getItem('account.selected')
        this.context.accountSelect(selected)
    }

    onFieldChange(e: React.ChangeEvent<HTMLInputElement>) : void {
        this.setState({
            password: e.target.value,
        })
    }

    render() : ReactNode {
        return (
            <>
                <If condition={!this.context.accountSelected}>
                    <Then>
                        <SelectAccount />
                    </Then>
                    <Else>
                        {() => {
                            const name = this.context.accountSelected.longName || this.context.accountSelected.name
                            const avatar = this.context.accountSelected.avatar || <Ficon icon='User' />

                            return (
                                <div className='flex flex-column'>
                                    <div className='my-16'>
                                        <div className='text-center'>
                                            {avatar}
                                        </div>
                                        {name}
                                    </div>
                                    <div className='mb-5'>
                                        <input
                                            className='rounded-lg bg-gray-200 p-2 w-full'
                                            value={this.state.password}
                                            onChange={this.onFieldChange.bind(this)}
                                        />
                                    </div>
                                    <div className='flex flex-column sm:flex-row justify-between w-full mt-6'>
                                        <a
                                            className='mt-5 sm:mt-0 order-1 sm:order-0'
                                            onClick={this.context.accountSelect.bind(this, null)}
                                        >
                                            {i18n.t('btn.switch_account')}
                                        </a>
                                        <button
                                            className='bg-blue-400 text-white py-2 px-4 rounded-3xl order-0 sm:order-1'
                                            onClick={() => alert('not implemented')}
                                        >
                                            <Ficon icon='ArrowRight' className='mr-3' />
                                            {i18n.t('btn.login')}
                                        </button>
                                    </div>
                                </div>
                            )
                        }}
                    </Else>
                </If>
            </>
        )
    }
}
