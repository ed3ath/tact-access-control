import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { GrantRole, TestAccessControl } from '../wrappers/AccessControl';
import '@ton/test-utils';

describe('AccessControl', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nonAdmin: SandboxContract<TreasuryContract>;
    let tester: SandboxContract<TreasuryContract>;
    let testAccessControl: SandboxContract<TestAccessControl>;

    const DEFAULT_ADMIN_ROLE = 1n;
    const TESTER_ROLE = 2n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        testAccessControl = blockchain.openContract(await TestAccessControl.fromInit());

        deployer = await blockchain.treasury('deployer');
        nonAdmin = await blockchain.treasury('nonAdmin');
        tester = await blockchain.treasury('tester');

        const deployResult = await testAccessControl.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: testAccessControl.address,
            deploy: true,
            success: true,
        });
    });

    it('Should grant DEFAULT_ADMIN_ROLE to deployer', async () => {
        expect(await testAccessControl.getHasRole(DEFAULT_ADMIN_ROLE, deployer.address)).toBeTruthy()
    });

    it("Admin should be able to grant tester role to tester", async() => {
        const GrantRole: GrantRole = {
            $$type: "GrantRole",
            role: TESTER_ROLE,
            user: tester.address
        }
        const grantRole = await testAccessControl.send(deployer.getSender(), {value: toNano("0.01")}, GrantRole);
        expect(grantRole.transactions).toHaveTransaction({
            from: deployer.address,
            to: testAccessControl.address,
            success: true,
        });
        expect(await testAccessControl.getHasRole(TESTER_ROLE, tester.address)).toBeTruthy();
    });

    it("Non-admin should not be able to grant tester role to tester", async() => {
        const GrantRole: GrantRole = {
            $$type: "GrantRole",
            role: TESTER_ROLE,
            user: tester.address
        }
        const grantRole = await testAccessControl.send(nonAdmin.getSender(), {value: toNano("0.01")}, GrantRole);
        expect(grantRole.transactions).toHaveTransaction({
            from: nonAdmin.address,
            to: testAccessControl.address,
            success: false,
            exitCode: 43784 // Unauthorized user
        });
    });

    it('Admin should be able to send only admin message', async () => {
        const message = await testAccessControl.send(deployer.getSender(), { value: toNano("0.01") }, "only admin");
        expect(message.transactions).toHaveTransaction({
            from: deployer.address,
            to: testAccessControl.address,
            success: true,
        });
    });

    it('Non-admin should not be able to send only admin message', async () => {
        const message = await testAccessControl.send(nonAdmin.getSender(), { value: toNano("0.01") }, "only admin");
        expect(message.transactions).toHaveTransaction({
            from: nonAdmin.address,
            to: testAccessControl.address,
            success: false,
            exitCode: 43784 // Unauthorized user
        });
    });

    it('Admin or tester should be able to send only tester or admin message', async () => {
        
        const GrantRole: GrantRole = {
            $$type: "GrantRole",
            role: TESTER_ROLE,
            user: tester.address
        }
        await testAccessControl.send(deployer.getSender(), {value: toNano("0.01")}, GrantRole);

        const adminMessage = await testAccessControl.send(deployer.getSender(), { value: toNano("0.01") }, "only tester or admin");
        expect(adminMessage.transactions).toHaveTransaction({
            from: deployer.address,
            to: testAccessControl.address,
            success: true,
        });

        const testerMessage = await testAccessControl.send(tester.getSender(), { value: toNano("0.01") }, "only tester or admin");
        expect(testerMessage.transactions).toHaveTransaction({
            from: tester.address,
            to: testAccessControl.address,
            success: true,
        });
    });

    it('Non-admin should not be able to send only tester or admin message', async () => {
        const message = await testAccessControl.send(nonAdmin.getSender(), { value: toNano("0.01") }, "only tester or admin");
        expect(message.transactions).toHaveTransaction({
            from: nonAdmin.address,
            to: testAccessControl.address,
            success: false,
            exitCode: 43784 // Unauthorized user
        });
    });
});
