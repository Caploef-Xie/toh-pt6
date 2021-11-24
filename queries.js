process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const { Client } = require('pg');



const query1 = `SELECT height, total_raw_bytes_power, total_qa_bytes_power, total_pledge_collateral, qa_smoothed_position_estimate, qa_smoothed_velocity_estimate
				from chain_powers s
				WHERE height % 5760 = 0
				ORDER BY height ASC`;
const query2 = `SELECT height, new_reward, new_reward_smoothed_position_estimate, new_reward_smoothed_velocity_estimate,new_baseline_power
				FROM chain_rewards 
				WHERE height % 5760 = 0
				ORDER BY height ASC`;
const query3 = `SELECT cp.height,burnt_fil,circulating_fil,locked_fil,mined_fil,vested_fil FROM chain_economics ce LEFT JOIN chain_powers cp ON cp.state_root = ce.parent_state_root 
				WHERE height % 5760 = 0
				ORDER BY height ASC`;


var from_chain_powers = function(client, cb) {
    var result = client.query(query1, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        let results = [];
        results.push(res.rows);
        cb(results);

    });
}

const from_chain_rewards = function(client, populated, cb) {
    client.query(query2, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        populated.push(res.rows);
        cb(populated);
    });
}

const from_chain_economics = function(client, populated, cb) {
    client.query(query3, (err, res) => {
        if (err) {
            console.error(err);
            return;
            
        }
        populated.push(res.rows);
        cb(populated);
    });
}

const create_client = function(cb) {
    const connectionString = "postgresql://starboard:rxmc6ykxaqu103n6@replica-mainnet-fildev-network-protocol-5870.a.timescaledb.io:13573/sentinel-analysis?sslmode=require";
    const client = new Client(connectionString);
    client.connect();
    console.log('HAHAHA')
    cb(client);
}

const retrieve_data = final_step => {
    create_client(function(client) {
        from_chain_powers(client, function(result) {
            from_chain_rewards(client, result, function(result2) {
                from_chain_economics(client, result2, function(result3) {
                    final_step(result3);
                    client.end();
                });
            });
        });
    });
}

const getData = (request, response) => {
    retrieve_data(function(value) {
        result = {};

        BH = [];
        RB = [];
        QA = [];
        PL = [];
        PO = [];
        VE = [];
        R = [];
        RP = [];
        RV = [];
        BP = [];
        BF = [];
        CF = [];
        LF = [];
        MF = [];
        VF = [];
        names = ['BLOCKHEIGHT',
            'RB_POW',
            'QA_POW',
            'PLEDGE',
            'QA_POS',
            'QA_VEL',
            'REW',
            'REW_POS',
            'REW_VEL',
            'BL_POW',
            'BURUNT',
            'CIRCULATING',
            'LOCKED',
            'MINED',
            'VESTED'
        ]
        for (var i = 0; i < value[0].length; i++) {

            //block height
            BH.push(value[0][i]['height']);

            //total_raw_bytes_power IS 'Total storage power in bytes in the network. Raw byte power is the size of a sector in bytes.'
            RB.push(value[0][i]['total_raw_bytes_power'] / Math.pow(2, 60)); //unit is converted to EiB

            //total_qa_bytes_power IS 'Total quality adjusted storage power in bytes in the network. Quality adjusted power is a weighted average of the quality of its space and it is based on the size, duration and quality of its deals.'
            QA.push(value[0][i]['total_qa_bytes_power'] / Math.pow(2, 60)); //unit is converted to EiB

            //total_pledge_collateral IS 'Total locked FIL (attoFIL) miners have pledged as collateral in order to participate in the economy.'
            PL.push(value[0][i]['total_pledge_collateral'] / (Math.pow(10, 18) * Math.pow(10, 6))); //unit is converted to M-FIL

            //qa_smoothed_position_estimate IS 'Total power smoothed position estimate - Alpha Beta Filter "position" (value) estimate in Q.128 format.'
            PO.push(value[0][i]['qa_smoothed_position_estimate'] / (Math.pow(2, 128) * Math.pow(2, 60))); //unit is converted to EiB

            //qa_smoothed_velocity_estimate IS 'Total power smoothed velocity estimate - Alpha Beta Filter "velocity" (rate of change of value) estimate in Q.128 format.'
            VE.push(value[0][i]['qa_smoothed_velocity_estimate'] / (Math.pow(2, 128) * Math.pow(2, 40))); //unit is TiB


            if (i < value[1].length) {
                //new_reward IS 'The reward to be paid in per WinCount to block producers. The actual reward total paid out depends on the number of winners in any round. This value is recomputed every non-null epoch and used in the next non-null epoch.'
                R.push(Number(value[1][i]['new_reward'] / (Math.pow(10, 18) * 5))); //unit is converted to FIL, divided by 5 to show the per block reward

                //new_reward_smoothed_position_estimate IS 'Smoothed reward position estimate - Alpha Beta Filter "position" (value) estimate in Q.128 format.';
                RP.push(Number(value[1][i]['new_reward_smoothed_position_estimate'] / (Math.pow(2, 128) * Math.pow(10, 18) * 5))); //unit is converted to FIL, divided by 5 to show the per block reward

                //new_reward_smoothed_velocity_estimate IS 'Smoothed reward velocity estimate - Alpha Beta Filter "velocity" (rate of change of value) estimate in Q.128 format.'
                RV.push(Number(value[1][i]['new_reward_smoothed_velocity_estimate'] / (Math.pow(2, 128) * Math.pow(10, 12) * 5))); //unit is microFIL, divided by 5 to show the per block reward
                //new_baseline_power IS 'The baseline power (in bytes) the network is targeting.'
                BP.push(value[1][i]['new_baseline_power'] / Math.pow(2, 60)); //unit is converted to EiB
            }
            if (i < value[2].length) {
                //COLUMN chain_economics.burnt_fil IS 'Total FIL (attoFIL) burned as part of penalties and on-chain computations.';
                BF.push(value[2][i]['burnt_fil'] / (Math.pow(10, 18) * Math.pow(10, 6))); //unit is converted to M-FIL

                //COLUMN chain_economics.circulating_fil IS 'The amount of FIL (attoFIL) circulating and tradeable in the economy. The basis for Market Cap calculations.';
                CF.push(value[2][i]['circulating_fil'] / (Math.pow(10, 18) * Math.pow(10, 6))); //unit is converted to M-FIL

                //COLUMN chain_economics.locked_fil IS 'The amount of FIL (attoFIL) locked as part of mining, deals, and other mechanisms.';
                LF.push(value[2][i]['locked_fil'] / (Math.pow(10, 18) * Math.pow(10, 6))); //unit is converted to M-FIL

                //COLUMN chain_economics.mined_fil IS 'The amount of FIL (attoFIL) that has been mined by storage miners.';
                MF.push(value[2][i]['mined_fil'] / (Math.pow(10, 18) * Math.pow(10, 6))); //unit is converted to M-FIL

                //COLUMN chain_economics.vested_fil IS 'Total amount of FIL (attoFIL) that is vested from genesis allocation.'
                VF.push(value[2][i]['vested_fil'] / (Math.pow(10, 18) * Math.pow(10, 6))); //unit is converted to M-FIL
            }
        }
        result[names[0]] = BH;
        result[names[1]] = RB;
        result[names[2]] = QA;
        result[names[3]] = PL;
        result[names[4]] = PO;
        result[names[5]] = VE;
        result[names[6]] = R;
        result[names[7]] = RP;
        result[names[8]] = RV;
        result[names[9]] = BP;
        result[names[10]] = BF;
        result[names[11]] = CF;
        result[names[12]] = LF;
        result[names[13]] = MF;
        result[names[14]] = VF;

        response.status(200).send(result);
    });
}

module.exports = {
    getData
}