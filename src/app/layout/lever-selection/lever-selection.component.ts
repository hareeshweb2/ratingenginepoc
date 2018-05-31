import { element } from 'protractor';
import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { FormGroup, FormBuilder, Validators, ValidatorFn } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Message } from 'primeng/api';

@Component({
    selector: 'app-lever-selection',
    templateUrl: './lever-selection.component.html',
    styleUrls: ['./lever-selection.component.scss'],
    animations: [routerTransition()]
})
export class LeverSelectionComponent implements OnInit {
    empContributeModel: any;
    isCopayPlan: boolean = true;
    endPointUrl: string = "http://pricing-qa.corvestacloud.com:8708";
    //endPointUrl: string="http://rhel7-ws04:8708";
    //endPointUrl: string = 'http://pricing-sandbox.sandboxcorvestacloud.com:8708';

    empContribute: any;
    empContributeValues: any = [
        { id: 1, value: 'Yes  (show Contributory Plans only)' },
        { id: 2, value: 'No (show Voluntary Plans only)' },
        { id: 3, value: 'Not sure (show all plans available)' }
    ];
    msgs: Message[] = [];
    leversWithoutNetworks: any;
    showRates: boolean = false;
    rates: any;
    leversDataAfterAllLeversSelected: any;
    leversDataAfterPlanSelection: any;
    leversAfterPlan: any;
    leversAfterAllLeversSelected: any;
    alerts: any;
    plans: any;
    initialResponse: any;
    response2: any;
    response3: any;
    ratesRequest: any;
    updatedFormatOfLevers: any = [];
    updatedFormatOfLeversAfterAllLeversSelected: any = [];
    leverForm: FormGroup;
    showPlans: boolean = false;
    selectedPlan;
    leversReqWithAllSelectedLevers: any;
    networdIds: any = [];

    networksList = ['Premier', 'PPO', 'OON'];

    arrRegions: any;
    arrPlanTypes: any;
    arrNAICS: any;
    arrNoOfEmps: any;
    arrCoverages: any;
    arrContributes: any;

    regionLeverId: any;
    planTypeLeverId: any;
    NAICSLeverId: any;
    noOfEmpsLeverId: any;
    coveragesLeverId: any;
    contributesLeverId: any;
    planLeverId: any;

    constructor(private fb: FormBuilder, private http: HttpClient) {}

    ngOnInit() {
        this.leverForm = this.fb.group({
            dateEffective: ['2018-01-01', [Validators.required]],
            typeOfPlan: ['', [Validators.required]],
            replacingCoverage: ['', [Validators.required]],
            nics: ['444110', [Validators.required]],
            zipCode: ['24401', [Validators.required, Validators.pattern('[0-9]{5}')]],
            noOfEmps: ['10', [Validators.required]],
            noOfEmpsVA: ['1', [Validators.required]],
            eligibleNumberOfEmps: ['15', [Validators.required]]
        });

        let dateObj: any = new Date();
        let month: any = dateObj.getUTCMonth() + 1;
        if (month < 10) {
            month = '0' + month;
        }
        let day: any = dateObj.getUTCDate();
        if (day < 10) {
            day = '0' + day;
        }
        let year = dateObj.getUTCFullYear();
        let newdate = year + '-' + month + '-' + day;

        let initialRequest = {
            healthcareCompanyId: 1,
            subcompanyId: 1,
            effectiveDate: newdate,
            numberOfEmpsOutsideVa: null,
            zipCode: null,
            selections: null
        };

        //server
        this.http
            .post(this.endPointUrl + '/pricing/api/pricing/nextlevers', initialRequest)
            .subscribe(
                data => {
                    this.selectedPlan = '';
                    this.initialResponse = data;
                    if (this.initialResponse.message) {
                        alert('No Data');
                        this.plans = [];
                        return;
                    } else {
                        this.arrNoOfEmps = this.initialResponse.levers.find(
                            i => i.name == 'NUMBER OF EMPLOYEES'
                        ).elements;
                        this.noOfEmpsLeverId = this.initialResponse.levers.find(
                            i => i.name == 'NUMBER OF EMPLOYEES'
                        ).id;
                        this.arrPlanTypes = this.initialResponse.levers.find(
                            i => i.name == 'PLAN TYPE'
                        ).elements;
                        this.planTypeLeverId = this.initialResponse.levers.find(
                            i => i.name == 'PLAN TYPE'
                        ).id;
                        this.arrCoverages = this.initialResponse.levers.find(
                            i => i.name == 'REPLACING COVERAGE'
                        ).elements;
                        this.coveragesLeverId = this.initialResponse.levers.find(
                            i => i.name == 'REPLACING COVERAGE'
                        ).id;
                        this.arrContributes = this.initialResponse.levers.find(
                            i => i.name == 'EMPLOYER WILL CONTRIBUTE'
                        ).elements;
                        this.contributesLeverId = this.initialResponse.levers.find(
                            i => i.name == 'EMPLOYER WILL CONTRIBUTE'
                        ).id;
                    }
                },
                error => {
                    this.plans = [];
                    console.log('Response ERROR: ' + JSON.stringify(error));
                    this.msgs.push({
                        severity: 'error',
                        summary: 'Validation',
                        detail: error.error.message
                    });
                    return Observable.throw(error);
                }
            );
        //server end
    }

    public closeAlert(alert: any) {
        const index: number = this.alerts.indexOf(alert);
        this.alerts.splice(index, 1);
    }

    submit() {
        this.selectedPlan = '';

        this.showRates = false;
        this.rates = [];
        this.msgs = [];

        let request2 = {
            healthcareCompanyId: 1,
            subcompanyId: 1,
            effectiveDate: this.leverForm.value.dateEffective,
            zipCode: this.leverForm.value.zipCode,
            numberOfEmpsOutsideVa: this.leverForm.value.noOfEmpsVA,
            selections: [
                {
                    leverId: this.noOfEmpsLeverId,
                    elementId: null,
                    selectedValue: this.leverForm.value.noOfEmps.toString()
                },
                {
                    leverId: this.planTypeLeverId,
                    elementId: this.leverForm.value.typeOfPlan.id,
                    selectedValue: this.leverForm.value.typeOfPlan.value
                },
                {
                    leverId: this.coveragesLeverId,
                    elementId: this.leverForm.value.replacingCoverage.id,
                    selectedValue: this.leverForm.value.replacingCoverage.value
                }
            ]
        };

        //server
        this.http.post(this.endPointUrl + '/pricing/api/pricing/nextlevers', request2).subscribe(
            data => {
                this.showPlans = true;
                this.msgs = [];
                this.response2 = data;
                if (this.response2.message) {
                    alert(this.response2.message);
                    this.plans = [];
                    return;
                } else {
                    this.selectedPlan = 'junk';
                    this.response3 = data;
                    this.leversWithoutNetworks = this.response3.levers.filter(
                        el => el.network == null
                    );
                    if (this.response3.message) {
                        alert('No Data Found for this selection');
                        return;
                    }
                }
            },
            error => {
                this.plans = [];
                console.log('Response ERROR: ' + JSON.stringify(error));
                this.msgs.push({
                    severity: 'error',
                    summary: 'Validation',
                    detail: error.error.message
                });
                return Observable.throw(error);
            }
        );
        //server end
    }

    //after plan selection

    getResponseForPlan() {
        this.rates = [];
        this.updatedFormatOfLevers = [];
        this.showPlans = true;

        let request3 = {
            healthcareCompanyId: 1,
            subcompanyId: 1,
            effectiveDate: this.leverForm.value.dateEffective,
            zipCode: this.leverForm.value.zipCode,
            numberOfEmpsOutsideVa: this.leverForm.value.noOfEmpsVA,
            selections: [
                {
                    leverId: this.planLeverId,
                    elementId: this.selectedPlan.id,
                    selectedValue: this.selectedPlan.value
                }
            ]
        };

        //server start
        this.http.post(this.endPointUrl + '/pricing/api/pricing/nextlevers', request3).subscribe(
            data => {
                this.msgs = [];
                this.response3 = data;
                this.leversWithoutNetworks = this.response3.levers.filter(el => el.network == null);
                if (this.response3.message) {
                    alert('No Data Found for this selection');
                    return;
                }
            },
            error => {
                this.plans = [];
                console.log('Response ERROR: ' + JSON.stringify(error));
                this.msgs.push({
                    severity: 'error',
                    summary: 'Validation',
                    detail: error.error.message
                });
                return Observable.throw(error);
            }
        );
        //server end
    }

    //end after plan selection

    //call after all levers selected start
    getRates() {
        this.showRates = false;
        this.rates = [];
        this.updatedFormatOfLeversAfterAllLeversSelected = [];
        this.networdIds = [];
        this.ratesRequest = {
            healthcareCompanyId: 1,
            subcompanyId: 1,
            effectiveDate: this.leverForm.value.dateEffective,
            zipCode: this.leverForm.value.zipCode,
            eligibleNumberOfEmps: this.leverForm.value.eligibleNumberOfEmps,
            naics: this.leverForm.value.nics,
            isCopayPlan: this.isCopayPlan,
            selections: []
        };

        let empLever: any = {
            leverId: this.noOfEmpsLeverId,
            elementId: null,
            selectedValue: this.leverForm.value.noOfEmps.toString()
        };
        this.ratesRequest.selections.push(empLever);
        let planTypeLever: any = {
            leverId: this.planTypeLeverId,
            elementId: this.leverForm.value.typeOfPlan.id,
            selectedValue: this.leverForm.value.typeOfPlan.value
        };
        this.ratesRequest.selections.push(planTypeLever);

        let empContributeLever: any = {
            leverId: this.contributesLeverId,
            elementId: this.empContributeModel.id,
            selectedValue: this.empContributeModel.value
        };
        this.ratesRequest.selections.push(empContributeLever);

        let coverageLever: any = {
            leverId: this.coveragesLeverId,
            elementId: this.leverForm.value.replacingCoverage.id,
            selectedValue: this.leverForm.value.replacingCoverage.value
        };
        this.ratesRequest.selections.push(coverageLever);

        this.response3.levers.forEach(element => {
            if (element.elements.length == 1) {
                let obj = {
                    leverId: element.id,
                    elementId: element.elements[0].id,
                    selectedValue: element.elements[0].value
                };
                this.ratesRequest.selections.push(obj);
            }

            if (element.selectedValue) {
                let obj = {
                    leverId: element.id,
                    elementId: element.selectedValue.id,
                    selectedValue: element.selectedValue.value
                };
                this.ratesRequest.selections.push(obj);
            }
        });

        //server start
        this.http
            .post(this.endPointUrl + '/pricing/api/pricing/rates', this.ratesRequest)
            .subscribe(
                data => {
                    this.msgs = [];
                    this.showRates = true;

                     let ratesResponse: any = data;
                   /*  let ratesResponse: any = {
                        ratedPlans: [
                            {
                                name: 'PPO/EPO CP140',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'None'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': 'Co-Pay',
                                            'BASIC DENTAL CARE': 'Co-Pay',
                                            'MAJOR DENTAL CARE': 'Co-Pay',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'Regular Rates',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 23.77
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 49.91
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 52.29
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 52.29
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 80.81
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO/EPO CP360',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'None'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': 'Co-Pay',
                                            'BASIC DENTAL CARE': 'Co-Pay',
                                            'MAJOR DENTAL CARE': 'Co-Pay',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'Regular Rates',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 29.34
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 61.62
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 64.55
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 64.55
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 99.76
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO/EPO CP140, Voluntary',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'None'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': 'Co-Pay',
                                            'BASIC DENTAL CARE': 'Co-Pay',
                                            'MAJOR DENTAL CARE': 'Co-Pay',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'Regular Rates',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 26.68
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 56.02
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 58.69
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 58.69
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 90.7
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO/EPO CP360, Voluntary',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'None'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': 'Co-Pay',
                                            'BASIC DENTAL CARE': 'Co-Pay',
                                            'MAJOR DENTAL CARE': 'Co-Pay',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '0',
                                            'BASIC DENTAL CARE': '0',
                                            'MAJOR DENTAL CARE': '0',
                                            'ORTHO DENTAL CARE': '0'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'Regular Rates',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 32.94
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 69.16
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 72.46
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 72.46
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 111.98
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO Plus Premier Passive',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'Annual per person, limited to three per family'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'REGULAR RATES',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 20.5
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 34.5
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 60.09
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 55.55
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 70.19
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO Plus Premier Active - Option 1',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'Annual per person, limited to three per family'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'REGULAR RATES',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 31.56
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 55.06
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 90.02
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 84.56
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 108.2
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO Plus Premier Active - Option 2',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'Annual per person, limited to three per family'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'REGULAR RATES',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 18.99
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 31.68
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 55.99
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 51.57
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 64.99
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PPO PASSIVE +',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'Annual per person, limited to three per family'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PPO',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'REGULAR RATES',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 28.99
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 50.3
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 83.14
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 77.89
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 99.44
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'PREMIER',
                                limitations: {
                                    'ANNUAL MAXIMUM': 'Per person, per benefit period',
                                    DEDUCTIBLE: 'Annual per person, limited to three per family'
                                },
                                networkPaymentDetails: [
                                    {
                                        network: 'PREMIER',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    },
                                    {
                                        network: 'OON',
                                        details: {
                                            'DIAGNOSTIC AND PREVENTATIVE CARE': '100',
                                            'BASIC DENTAL CARE': '80',
                                            'MAJOR DENTAL CARE': '50',
                                            'ORTHO DENTAL CARE': '50'
                                        }
                                    }
                                ],
                                rateGroups: [
                                    {
                                        groupName: 'REGULAR RATES',
                                        rates: [
                                            {
                                                tier: 'EMPLOYEE TIER',
                                                amount: 14.95
                                            },
                                            {
                                                tier: 'EE+SPOUSE TIER',
                                                amount: 24.17
                                            },
                                            {
                                                tier: 'EE+DEP TIER',
                                                amount: 45.23
                                            },
                                            {
                                                tier: 'EE+DEPS TIER',
                                                amount: 41.14
                                            },
                                            {
                                                tier: 'FAMILY TIER',
                                                amount: 51.28
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        warning:
                            'Please Note: Some plans do not meet the participation requirements.'
                    }; */

                    if (ratesResponse.message) {
                        this.msgs.push({
                            severity: 'error',
                            summary: 'Validation',
                            detail: ratesResponse.message
                        });
                        return;
                    } else {
                        this.rates = ratesResponse;
                        if (this.rates.warning)
                            this.msgs.push({
                                severity: 'warn',
                                summary: 'Warning',
                                detail:
                                    'Please Note: Some plans do not meet the participation requirements.'
                            });
                    }
                },
                error => {
                    console.log('Response ERROR: ' + JSON.stringify(error));
                    this.msgs.push({
                        severity: 'error',
                        summary: 'Validation',
                        detail: error.error.message
                    });
                    return Observable.throw(error);
                }
            );

        //server end
    }

    //end call after all levers selected
}
