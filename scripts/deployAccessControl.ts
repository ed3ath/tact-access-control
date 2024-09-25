import { toNano } from '@ton/core';
import { AccessControl } from '../wrappers/AccessControl';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const accessControl = provider.open(await AccessControl.fromInit());

    await accessControl.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(accessControl.address);

    // run methods on `accessControl`
}
