import { Modal } from 'antd'
import Router from 'next/router'
import React, { Component, ReactNode } from 'react'

import AppContext from '../app-context'
import Ficon from '../ficon'

type State = {
}

export default class EntityInfo extends Component<Record<string, unknown>, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {}

    async redirectToEntityIfAvailable() : Promise<void> {
        if (!this.context.web3Wallet.hasWallet()) {
            return
        }

        const address = await this.context.web3Wallet.getAddress()

        try {
            await this.context.refreshEntityMetadata(address)

            Router.push(`/entities/#/${address}`);
        } catch (e) {
            console.error(e)
            Modal.confirm({
                title: 'Entity not found',
                icon: <Ficon icon='AlertCircle' />,
                content: 'It looks like your account is not linked to an existing entity. Do you want to create it now?',
                okText: 'Create Entity',
                okType: 'primary',
                cancelText: 'Not now',
                onOk: () => {
                    Router.push('/entities/new')
                },
            })
        }
    }

    render() : ReactNode {
        return <div>Entity Info (and redirect)</div>
    }
}
