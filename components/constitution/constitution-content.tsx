"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

const constitutionSections = [
    {
        title: "PREAMBLE",
        content: "We are in a society where the need to return mankind to the way of Allah becomes a binding duty incumbent upon a set of people who are not in “a state of loss”.  A society becomes habitable for human beings when the divine laws are established.  Hence, in an attempt to achieve this ideal, we hereby enact and give to ourselves the following constitution in pursuit of our search for the pleasure of Allah."
    },
    {
        title: "SECTION 1: GENERAL PROVISIONS",
        content: `1.1 NAME:
The name of the organisation shall be “THE MUSLIM CONGRESS (TMC)”. Herein after referred to as 'The Congress'.

1.2 MOTTO:
The Motto of The Congress Shall be “In Tansurullaha Yansurkum.” “If you aid the cause of Allah, He will aid you”.

1.3 BASIS:
The basis of The Congress shall be AL-QUR’AN AND SUNNAH.

1.4 VISION:
To be the foremost organisation guiding, influencing and setting agenda for societal reformation in line with Qur’an and Sunnah.

1.5 MISSION:
By providing Islamic forum for education, reformation and collaboration, we set the agenda for repositioning of the Ummah.`
    },
    {
        title: "1.6 OBJECTIVES",
        content: `To spread the comprehensive understanding of Islam to humanity.
To revive the role of the mosque as an institution in the society.
To promote, demonstrate and preserve Islamic thoughts, values and ideals.
To drive Islamic agenda through collaboration with other personalities and organisations.
To facilitate charitable and social services for practical demonstration of the Islamic message.
To develop visionary leaders and produce goal-oriented Muslims.
To promote and establish an economic framework based on Islamic values.
To facilitate the restoration of Arabic as the language of Muslims.`
    },
    {
        title: "1.7 CONDITION AND DUTIES",
        content: `1.7.1 CONDITION:
He must be a practising male Muslim.
He must believe in the aims and objectives of The Congress.
He must be ready to submit to the leadership of The Congress.
He must be registered at a branch level.

1.7.2 DUTIES:
Every member must work towards achieving the aims and objectives of ‘The Congress’
Every member must obey the leadership of The Congress.
Every member must discharge his responsibilities in good faith.
Every member must endeavour to attend programmes.
Every member must fulfil his financial obligations promptly.`
    },
    {
        title: "1.8 MEMBERSHIP",
        content: `1.8.1 LEVEL:
There shall be two levels of membership, namely;
- Member
- Fellow

1.8.2 CRITERIA:
1.8.2.1 MEMBER:
Readiness and willingness to learn.
Readiness to accept the aims, the objectives and the basis of The Congress.
Readiness to follow Islamic way of life.

1.8.2.2 FELLOW:
Shall be a honorary member.
Shall not be eligible for posts in The Congress.
His source of income must be basically halal.
Readiness and willingness to assist the cause of The Congress.
Readiness to identify with the aims and objectives of The Congress.
He must be above forty (40) years of age.`
    },
    {
        title: "1.9 ORGANISATION STRUCTURE",
        content: `The Congress shall be organised on five levels namely: Shurah, National, State, Local Government and Branch.

1.9.1 GEOGRAPHICAL DEFINITION OF LEVEL:
I. THE SHURAH: Shall be understood to mean the policy-making body at national and international levels.
II. NATIONAL: Shall represent a country.
III. STATE: Shall be understood to mean any administrative unit under the National as defined by the National E-IN-C from time to time.
IV. LOCAL GOVERNMENT: Shall be understood to mean any administrative unit under the State as defined by the National E-IN-C from time to time.
V. BRANCH: Shall be understood to mean any administrative unit under the local Government as defined by the State E-IN-C from time to time.

1.9.2 OFFICES IN THE MUSLIM CONGRESS

1.9.2.1 SHURAH:
1.9.2.1.1 SHURAH LEVEL COMPOSITION
- The Shurah shall be composed of minimum of 7 and maximum of 15 members
- The Shurah shall be composed of present Amir and past Leaders
- Past Leaders refers to any member who had served the Congress either at the National or State level
- The Chairman of the Shurah shall be appointed from the past Leaders
- Quorum for meetings shall be 2/3 of the members

1.9.2.1.2 REMOVAL FROM SHURAH
A member shall cease to be a member at this level:
- On the occasion of death or physical incapability
- On the request of the person involved
- When are confirmed reports of activities that are inimical to the progress and image of the Congress
- Motion of removal shall be approved by 2/3 majority of duly constituted meeting

1.9.2.2 NATIONAL LEVEL:
The following shall be the offices and units at the national level:
- Amir
- Naibul Amir Administration (Administrative Unit, Expansion Unit)
- Naibul Amir Congress Guard Affairs (Training Unit, Manpower Development Unit, Public Services Unit)
- Naibul Amir External Affairs (Inter-Organisational Affairs Unit, International Affairs Unit, Government Relations Unit)
- Naibul Amir Information and Publications Affairs (Information Unit, Publications Unit, Internal Information Dissemination)
- Naibul Amir Da’wah and Cultural Affairs (Teskiyyah, Public Da’wah, Ulamau, Nikah, Aqiqah and Janazah, Drama and Cultural Enlightenment)
- Secretary General
- Assistant Secretary General
- National Financial Secretary (Fund Mobilisation and Management, Projects Financing Unit, Business Affairs Unit, Records Management Unit)
- National Project Officer (Design and Construction, Estate Management Unit, Asset Maintenance Unit)
- National Education Officer (Curriculum Development Unit, Schools Management Unit, Higher Institutions Affairs Unit)
- Auditor General (National Accounts Unit, States Accounts Unit, Projects Accounts Unit)

1.9.2.3 STATE LEVEL:
The following shall be the offices at the state level:
- Waali
- Radiful Waali
- Secretary
- Assistant Secretary
- Financial Secretary (Business Unit)
- Treasurer
- Congress Guard Affairs Officer
- Public Relations Officer
- Education Officer (Library Unit)
- Project Officer (Assets Maintenance Unit)
- Cultural Affairs Officer
- Welfare Officer
- External Affairs Officer

1.9.2.4 LOCAL GOVERNMENT:
The following shall be the offices at the Local Government level:
- Wakil
- Radiful Wakil
- Secretary
- Assistant Secretary
- Financial Secretary (Business Unit)
- Treasurer
- Congress Guard Affairs Officer
- Public Relations Officer
- Education Officer (Library Unit)
- Project Officer
- Cultural Affairs Officer
- External Affairs Officer

1.9.2.5 BRANCH:
- Raqib
- Radifur Raqib
- Secretary
- Assistant Secretary
- Financial Secretary
- Treasurer
- Congress Guard Affairs Officer
- Public Relations Officer
- Education Officer
- Project Officer
- Welfare Officer`
    },
    {
        title: "SECTION 2: THE SHURAH",
        content: `2.0 SHURAH

2.1 POWERS AND DUTIES OF THE SHURAH
- Shall be the highest decision-making body in TMC.
- Shall handle responsibility of formulating and approving new policies for implementation.
- Shall compose electoral shurah for National Offices
- Shall receive the report of electoral shurah and do the final ratification.
- Should the Shurah consider the proposed list not suitable, it shall direct the electoral shurah to begin a fresh process.
- Shall have the power to dissolve the National EC subject to the conditions stated in 3.3.1.1 (Emergency powers)`
    },
    {
        title: "SECTION 3: POWERS AND DUTIES OF COUNCILS",
        content: `3.1 POWERS AND DUTIES OF THE NATIONAL EXECUTIVE COUNCIL (EC)
- Shall be responsible for the day-to-day activities of The Congress.
- Shall handle all emergency matters.
- Shall receive for review and corrections all reports due to the Annual Congress.
- Shall ensure smooth handing over when change of all officers or one officer takes place and when a committee is dissolved for re-composition.
- Shall meet on monthly basis and as situation demands.
- All executive members shall be directly responsible to the Amir who could advise the EC to approve exchange of official responsibilities.
- Shall settle any conflict arising between the departments
- Shall have power to create, merge or dissolve units in departments or offices of the Congress
- Shall stand as consultative Council to the Amir.
- Shall initiate when necessary, ad-hoc committees and compose its membership.
- Shall have power to conduct elections and to ratify the result at state levels.
- Shall approve the appointment of officers in the state Executive councils as presented by the Wali and Secretary.
- Shall have the power to originate emergency or contingency programmes, arrange for them and coordinate their execution.
- Admission to any level above Member shall be the prerogative of the EC only.
- Shall prepare and present annual report of events of The Congress at the Annual Congress.
- Shall prepare and present a state of affairs of the Congress every five years at the relevant National Annual Congress.
- Shall have the power to appoint the External Auditor.
- Shall supervise the activities of the departments and receive regular reports from them.
- Quorum for meeting shall be presence of at least two-third (2/3) of officers.

3.2 POWERS AND DUTIES OF THE NATIONAL EXECUTIVE-IN-COUNCIL (E-IN-C)
The Executive-In-Council (E-In-C) shall be composed of all national officers plus Waali and Secretary of all functional states.
The E-In-C shall have the final say on all issues relating to The Congress, its departments and committees except where ‘The Shurah’ gives a fresh order after due consideration of the Islamic Legal process.
- (a) Shall have power to confirm, reject or defer movement within the membership levels.
- (b) Shall consider and approve “Fellows” on the recommendation of the EC.

- Shall have power to try and discipline any erring member(s).
- Shall have power to terminate membership of a member or group of members.
- Shall have power to question and redirect the activities of the EC.
- The council shall have power to constitute a disciplinary committee for disciplinary measures against erring members(s).
- Shall supervise the general administration of The Congress at the national level.
- Shall ensure that all decisions and resolutions of The Congress at the Annual Congress or E- In-C meetings are implemented to the letter.
- Shall hold meetings quarterly or as may be required to examine, introspect and direct the affairs of The Congress.
- Shall take appropriate steps that accord with the aspirations of The Congress to source fund, control and co-ordinate its disbursement.
- On the advice of the External Affairs Department, shall define and supervise the external relations of The Congress.
- Quorum for meeting shall be deemed to have been formed once five officers and the Waali or Secretary or representative of 2/3 of functional states are present.
- In the advent of a new administration, quorum shall be deemed to be formed once the Amir, Secretary General and representatives from 2/3 of functional states are present.
- Shall pursue vigorously, the extension of The Congress to parts of the society hitherto unreached and ensure that such extension is nurtured to maturity.
- Shall compose the Shariah Panel for The Congress.
- Shall approve the list of other National Officers as presented by the Amir`
    },
    {
        title: "SECTION 3: POWERS AND DUTIES OF OFFICERS",
        content: `3.3.1 AMIR: POWERS AND DUTIES
- Shall preside over all meetings of Executive Council and the Executive-In-Council meetings.
- Shall convey and preside over the National Annual Congress of The Congress.
- Shall ensure that all necessary reports to the Annual National Congress from every department or committee are ready.
- Shall have power of final say in the meeting presided by him.
- Shall be the chief spokesman for The Congress.
- Shall have power to appoint other members of the National EC, excluding the Secretary General, subject to the approval of the E-In-C
- Shall have power to delegate any of his responsibilities to any member for proper implementation.
- Shall have power to query any member of The Congress.
- Shall assume emergency powers as stated under conditions for emergency power.
- Shall be a signatory to the accounts of The Congress at the National level.
- Shall be a member of the Board of Patrons.
- Shall maintain an imprest account as fixed by the Executive Council.
- Shall oversee the day-to-day administration of The Congress.
- Shall ensure that all officers, departments and committees carry out their functions without undue delay.
- Shall present an annual report of events and state of affairs of The Congress at the Annual Congress. He can however delegate this to any executive or member as he deems fit.
- It is his paramount responsibility to ensure that the basis of The Congress- the Qur’an, the Sunnah and the constitution is strictly adhered to.
- Shall present the list of the Shurah members to the EC for approval

3.3.1.1 EMERGENCY: CONDITIONS AND PROCEDURE
A. CONDITIONS:
- Emergency situation is deemed to have commenced when there is evidence of break-down of law and order at any level.
- When there are proof(s) of extraneous interest(s) being perpetrated within The Congress at any level.
- When an individual or group of individuals become uncontrollable at their level or various levels and engage in utterances or activities that adversely affect or may adversely affect the image and effective functioning of The Congress.

B. PROCEDURE
- The Amir is empowered to suspend the Executive Council of any level or person or group of persons that may be involved or concerned except the national Executive Council.
- That forthwith, all directives on such issue or level shall be referred to the Amir for direction.
- That the Amir shall immediately put in action a fact finding committee with the view to finding a lasting solution to the situation which shall report back in not more than one month.
- That in case of a level of The Congress, a care taker committee may be composed and such committee shall be responsible to the Amir.
- That the Amir shall consider the report with advice from the Executive Council and pass a verdict on the situation.
- That the Executive Council is convened, briefed and made to approve the action by a simple majority.
- That in final analysis, the Amir pronounces a state of emergency and communicates to the affected person or group of persons or level.

3.3.2 THE NAWAIBUL-AMIR: DUTIES AND FUNCTIONS
- Shall be the head of their departments and shall exercise jurisdiction over the affairs of the department as approved by the EC
- Shall deputise for the Amir when such occasion arises.
- Shall prepare regular report/briefing notes for the EC meeting or on the request of the Amir.

3.3.3. THE SECRETARY GENERAL
- Shall be the head of the secretariat.
- Shall ensure prompt communication of decisions, resolutions or instructions to appropriate quarters.
- Shall monitor compliance with decisions, resolutions or instructions and make further recommendation to the Amir and/or the EC.
- Shall prepare a draft agenda for meetings and Annual Congress for the consideration of the Amir.
- Shall prepare the secretariat report as at and when called for by Amir.
- Shall prepare for, and present to the E-In-C, in consultation with the Amir, a progress report and recommend steps for further action.
- Shall receive all correspondence to The Congress and act on them in consultation with the Amir.
- Shall use his ingenuity to handle urgent issues (that should not be delayed) pending consultation with the Amir and or the EC and such consultation must not be delayed.
- Shall convene the National Annual Congress as may be directed by the Amir.
- Shall be a signatory to the National account.
- Shall have power to delegate any of his functions as and when necessary, to the Assistant Secretary Generals.
- Shall prepare an annual secretariat report for the Amir to be approved by the EC.
- Shall maintain an imprest account as fixed by the EC.

3.3.4 ASSISTANT SECRETARY GENERAL
- Shall take minutes of the meetings.
- He must ensure that meeting reports are prepared, approved by the Secretary General and circulated as stipulated.
- Shall deputise for the Secretary General and act in such capacity.
- Shall receive reports of all committees for the Secretary General.
- Shall ensure proper record-keeping of all records and activities of The Congress
- Shall be in charge of storage and retrieval of records

3.3.5. NATIONAL FINANCIAL OFFICER
- Shall be in charge of all financial matters of The Congress and in that capacity act as the custodian of all financial documents.
- Shall arrange for sourcing fund, and coordinate the effort.
- Shall prepare an annual financial report for the Amir towards the National Annual Congress to be approved by EC.
- Shall prepare regular financial briefings for the Amir, the EC and the E-In-C.
- Shall receive the financial report of all committees whether standing or ad-hoc for expert advice to the Amir and the EC.
- Shall head the financial committee to be composed of not more than seven members.
- Shall be a signatory to all accounts of The Congress at the National level.
- Shall attend to all cases of financial problems for expert advice to the Amir and the EC.
- Shall keep an imprest account as fixed by the EC.
- Shall prepare an annual financial budget to be approved by the EC.
- Shall co-ordinate all the business activities of The Congress. This shall be done under the Business Unit.
- Shall serve as external auditor to the state(s) account.
- Shall look into the account of The Congress at all levels for the purpose of auditing and inspection from time to time.
- Shall make known to the Amir, cases of financial misappropriation immediately it is detected.
- Shall prepare an annual report on The Congress financial activities for the year.
- Shall recommend suitable accounting method that may aid probity and accountability.

3.3.7 NATIONAL EDUCATION OFFICER
- Shall make known to all other levels, the education policy of The Congress.
- Shall monitor stage-to-stage development of the education policy of The Congress.
- Shall co-ordinate the education programmes at all levels and ensure compliance and conformity with national directives.
- Shall head the education committee to be composed of not less than three members.
- Shall receive educational requests of all committees and attend to them in consultation with the secretariat.
- Shall supervise activities relating to the award of scholarship.
- Shall recommend necessary texts for acquisition or production and develop research in essential areas.
- Shall prepare curricula for different educational levels with a view to meeting the educational needs of the levels and the educational aspirations of The Congress.
- Shall recommend to the EC and supervise the establishment of educational institutions.

3.3.9 NATIONAL PROJECT OFFICER
- Shall keep all project proposals for regular reference.
- Shall receive all new project ideas in memoranda from any department or office and recommend to the EC.
- Shall design project plans in conformity with Islamic standard for the approval of the EC.
- Shall execute all approved projects of The Congress.
- Shall handle special task assigned to the office by the EC.
- Shall be in charge of all property of The Congress.
- Shall head Assets Procurement and Maintenance Committee.
- Shall purchase all property for The Congress and ensure that they are to specification.
- Shall keep record of all materials, their movement and condition and keep the secretariat briefed on these issues.
- Shall approve movement of assets before such movement commences and ensure that users conform with laid down rules and regulations.
- Shall ensure proper maintenance of all assets of the Congress.`
    },
    {
        title: "SECTION 3: DEPARTMENTS",
        content: `3.4 DEPARTMENTS
There shall be established various departments to carry out duties herein mentioned and as may be assigned to them by the EC.

3.4.1 ADMINISTRATION (Headed by Naibul Amir Administration)
- Shall be in charge of all programmes of The Congress.
- Shall ensure programmes are organised at the appropriate time, according to the TMC Calendar at all levels.
- Shall be responsible for search and securing venues for all programmes of The Congress at the National Level.
- Shall remind the office concerned of its programme and ensure its planning as appropriate.
- Shall ensure the programmes are planned and executed according to its design
- Shall ensure that reports are written and submitted, in the required copies, at the appropriate time.
- Shall drive the Congress expansion to new areas

3.4.2 CONGRESS GUARDS AFFAIRS (Headed by Naibul Amir Congress Guard Affairs)
- Shall be responsible for organising the youth members at all levels of The Congress for physical-fitness.
- Shall organise the youth for communal services such as Traffic control, Public health, Vigilante, First aid etc.
- Shall organise camps periodically for The Congress Guards.
- Shall provide security at all programmes of The Congress.

3.4.3 EXTERNAL AFFAIRS (Headed by Naibul Amir External Affairs)
- Shall serve as link between The Congress and other Islamic organisations within and outside the country.
- Shall interact with various Islamic bodies in order to bringing about unity of Islamic workers.
- Shall understudy various bodies so as to know their interests and activities which may be positive or otherwise to the universal goal of Islam and objectives of The Congress with a view to achieving cooperation.
- Shall recommend to the EC, activities, projects and programmes that will foster unity and brotherhood and effective coordination within the ranks of various organisations.
- Shall serve as arbitration outreach to Islamic organisation during crisis.
- Shall coordinate all the activities of members of The Congress outside the country.
- Shall establish and maintain link with Muslims both individually and collectively outside the country.
- Shall participate, or organise activities that will promote exchange of ideas within the Islamic world at the instance of the EC for the approval of the E-In-C.
- Shall collect information about the world as it affects Islamic interests and others as deemed necessary.

3.4.4 INFORMATION AND PUBLICATIONS AFFAIRS (Headed by Naibul Amir Information and Publications Affairs)
- Shall be responsible for all the publications of The Congress at various levels.
- Shall pay attention to documentation and record keeping.
- Shall collect, collate and analyze data concerning individual and groups in the society as relevant to Islamic interest.
- Shall pay special attention to information about the activities of people or bodies outside The Congress as it affects Islamic interest.
- Shall serve as the Public Relation Officer for The Congress at National level.
- Shall ensure adequate and regular flow of information throughout all levels of The Congress.
- Shall arrange the information flow channel such that fault and distortion could easily be detected.
- Shall issue releases to communicate the stand of The Congress on any general societal issue after appropriate consultation with the secretariat.
- Shall oversee all issues concerning publicity.
- Shall serve as the Protocol Officer to the Amir.
- Shall serve as the media watch for The Congress and make appropriate contribution, rejoinder or explanation as the occasion may demand after due consultation with the secretariat.
- Shall sequel to information at his disposal, recommend areas of necessary research to the secretariat for the eventual approval of the Executive Committee.
- Shall observe the society closely and make regular reports of opportunities and perception of The Congress to the secretariat for eventual action.
- Shall possess a copy of all states’ programme schedules from the secretariat to ease information dissemination.

3.4.5 DA’WAH AND CULTURAL AFFAIRS

3.4.5.1 DA’WAH AFFAIRS UNIT (Headed by the Naibul Amir Da’wah and Cultural Affairs)
- Shall plan, co-ordinate and execute Da’wah activities throughout the levels of The Congress. Such activities shall include, Weekly Teskiyah, Public Lecture, Da’wah engagement, Personnel Training, Leadership Course etc.
- Shall be responsible for organising, monitoring and coordinating the activities of Muslim Ulama both within and outside The Congress and in conjunction with External Affairs department.
- Shall design training programmes, to include khutba presentation, current affairs, role modelling, Islamic ethics etc.

3.4.5.2 CULTURAL AFFAIRS UNIT
- Shall be responsible for all social and cultural activities of The Congress such as Aqiqah, Nikah, Get-Together, Janazah, Du’a etc.
- Shall promote and project the Islamic cultural life.
- Shall also render such similar services to outsiders provided they conform and comply with the Qur’an and Sunnah.
- Shall maintain and ensure proper functioning of cultural infrastructures of The Congress.
- Shall compose a committee(s) comprising of Cultural Affairs Officers of all states.
- Shall deposit money realised by the department at the appropriate office`
    },
    {
        title: "SECTION 4: STATE LEVEL",
        content: `4.0 STATE

4.1 POWER AND DUTIES OF THE STATE EXECUTIVE COUNCIL (EC)
- Shall be responsible for the day day activities of The Congress at the state level.
- Shall receive for reviews and corrections all state reports due to the State Annual Congress.
- Shall ensure smooth handing over when change of all officers or an officer takes place or when a committee is dissolved for re-composition.
- Shall meet regularly on monthly basis.
- All executive members at the state level shall be directly responsible to the Waali who could advise the EC (state) to approve exchange of official responsibilities.
- Shall initiate when necessary ad-hoc committee(s) and compose its membership.
- Shall stand as the Majlis Shura to the Waali.
- Shall have the power to conduct elections and the power to ratify the results at the Local Government and Branch levels.
- Shall prepare and present an annual report of events and state of affairs of The Congress at the state Annual Congress.
- Quorum for meeting shall be presence of at least 2/3 of officers.
- Shall appoint ad-hoc disciplinary committee as the need arises.

4.2 POWERS AND DUTIES OF THE STATE EXECUTIVE-IN-COUNCIL (E-INC)
- Shall be composed of all state officers plus the Wukala and Secretaries of all functioning Local Government councils.
- Shall be the highest decision making body in the state on all issues except where order of National Executive Council, Shariah Panel or Shurah over-rules.
- Shall have power to try and discipline any erring member(s).
- Shall have power to question and re-direct the activities of the EC at the state level.
- Shall have power to constitute a disciplinary committee.
- Shall supervise and carry out the general administration of The Congress at the state level.
- Shall ensure that all the decisions and resolutions of The Congress at the State Annual Congress or Executive-In-Council and executive meetings are implemented to the letter.
- Shall hold meetings, monthly, to examine, introspect and direct the affairs of The Congress.
- Shall pursue vigorously the extension of The Congress to part of the society hitherto unreached and ensure that such extension is nurtured to maturity.
- Quorum for meetings shall be deemed to have been formed once five officers and the Wakil and or secretary or representative of 2/3 of functional Local governments are present.
- Shall approve the list of local Government Executives as presented by the Wakil

4.3 POWERS AND DUTIES OF THE STATE OFFICERS

4.3.1 WAALI
- Shall preside over all State Executive and Executive-In-Council meetings.
- Shall convene and preside at the State Annual Congress.
- Shall ensure that all necessary reports to the State Annual Congress from every office or committee are ready.
- Shall have power of final say in the meetings presided over by him.
- Shall have power to appoint other members of the State Executive Council, excluding the Secretary, subject to the approval of National EC
- Shall have power to delegate any of his responsibilities to any member for proper implementation.
- Shall have power to query any member of The Congress under his jurisdiction.
- Shall be a signatory to the account of The Congress at the state level.
- Shall maintain an imprest account as fixed by the State Executive Council.

4.3.2 RADIFUL WAALI
- Shall deputise for the Waali when such occasion arises.
- Shall play the role of Da’wah Affairs Officer.
- Shall be a representative to the Da’wah and cultural Affairs Department, along with cultural Affairs Officer
- Shall perform the role of his department as stated under Da’wah and cultural Affairs Department.

4.3.3 SECRETARY
- Shall be the head of the Secretariat.
- Shall ensure prompt communication of decisions, resolutions or instructions to appropriate quarters.
- Shall monitor compliance with decisions, resolutions or instructions and make further recommendations to the Waali and the EC.
- Shall prepare draft agenda for meetings and State Annual Congress for the consideration of the Waali.
- Shall prepare the secretariat report as at and when called for by Waali.
- Shall prepare for and present to the State E-In-C in consultation with the Waali, a progress report and recommend steps for further actions.
- Shall receive all correspondence to The Congress and act on them in consultation with the Waali.
- Shall use his ingenuity to handle urgent issues pending consultation with Waali and/or the EC which must not be delayed.
- Shall convene the State Annual Congress as directed by the Waali.
- Shall be a signatory to the state account.
- Shall have power to delegate any of his functions as and when necessary to the Assistant Secretary.
- Shall prepare an annual secretariat report for the Waali to be approved by the State EC.
- Shall maintain an imprest account as approved by the State EC.

4.3.4 ASSISTANT SECRETARY
- Shall take minutes of meetings.
- Shall ensure that meeting reports are prepared, approved by the Secretary and circulated as stipulated.
- Shall receive reports of all committees on behalf of the Secretary.
- Shall deputise and act for the Secretary when necessary.

4.3.5 FINANCIAL SECRETARY
- Shall be in charge of all financial matters of The Congress at the state level and act also as custodian of all financial documents.
- Shall arrange for sourcing fund and co-ordinate the efforts.
- Shall prepare an annual financial report for the Waali toward the State Annual Congress to be approved by the State EC.
- Shall prepare regular financial briefing for the Waali.EC and E-In C
- Shall head the financial committee comprising of not more than 7 members.
- Shall receive the financial reports of all the committees, ad-hoc or standing, for expert advise to the Waali and State EC.
- Shall be a signatory to all accounts of The Congress at the state level.
- Shall prepare an annual financial budget to be approved by the State EC.

4.3.6 TREASURER
- Shall be in charge of all funds of The Congress
- Shall arrange for sourcing fund and coordinate the effort.
- Shall prepare regular financial briefings on funds for the Wakil.
- Shall keep an imprest account as fixed by the EC.

4.3.7 EDUCATION/LIBRARY OFFICER
- Shall liaise between National Education Office and other Education Officers in other levels of The Congress.
- Shall study the educational needs of the state and recommend the appropriate educational institution for the state.
- Shall head the Education committee comprising of not less than 3 members
- Shall see to the establishment of library services.
- Shall manage and maintain the Library.
- Shall work in conjunction with the Project, Education and Information and Publication Officers.
- Shall ensure proper maintenance of all assets of The Congress

4.3.8 PROJECT OFFICER /ASSETS MAINTENANCE UNIT
- Shall receive and keep all project proposals of the state for regular reference.
- Shall design project plans in conformity with Islamic standard for the approval of the EC.
- Shall be in charge of all property of The Congress at the level.
- Shall purchase all property for The Congress and ensure that they are to specification.
- Shall keep record of all materials, their movement and condition and keep the secretariat briefed on these issues.
- Shall approve movement of assets before such movement commences and ensure that users conform with laid down rules and regulations.

4.3.9 PUBLIC RELATIONS OFFICER
- Shall be the image maker of The Congress at the state level.
- Shall serve as the liaison officer between The Congress and public.
- Shall ensure adequate flow of information through all levels of The Congress.
- Shall issue releases to communicate the stand of The Congress after due consultation with the secretariat.
- Shall observe society closely and make regular report on opportunities and perception of The Congress to the secretariat for eventual action.

4.3.10 CULTURAL AFFAIRS OFFICER
- Shall represent the State at the Cultural Affairs Department.
- Shall also work according to the job specifications of the Cultural Affairs Unit in the Da’wah and cultural Affairs department Department

4.3.11 CONGRESS GUARD AFFAIRS OFFICER
- Shall represent the state at The Congress Guard Affairs Department.
- Shall also work according to the job specification of The Congress Guard Affairs Department.

4.3.12 WELFARE OFFICER
- Shall head the employment bureau.
- Shall organise welfare visits at State level.
- Shall recommend welfare project to the EC.
- Shall co-ordinate all welfare activities of The Congress at state level.

4.3.13 EXTERNAL AFFAIRS OFFICER
- Shall represent the State at the External Affairs department.
- Shall also work according to the job specification of the External Affairs department.`
    },
    {
        title: "SECTION 5: LOCAL GOVERNMENT",
        content: `5.0 LOCAL GOVERNMENT

5.1 POWERS AND DUTIES OF EXECUTIVE COUNCIL (EC)
- Shall be responsible for the day-to-day activities of The Congress at the Local Government Level.
- Shall receive for review and corrections all reports due to the Local Government Annual Congress.
- Shall ensure smooth handing over when change of one officer or all officers take place and when a committee is dissolved for re-composition.
- Shall meet regularly, on monthly basis.
- All executive members at the Local Government level shall be directly responsible to the Wakil who could advice the EC to approve exchange of official responsibilities.
- Shall initiate ad-hoc committee(s) when necessary and compose its membership.
- Shall stand as the Majlis shura to the Wakil.
- Shall prepare and present an annual report of events and state of affairs of The Congress at the Local Government Annual Congress.
- Quorum for meeting shall be presence of at least 2/3 of officers.
- Shall appoint ad-hoc disciplinary committee as the need arises

5.2 POWERS AND DUTIES OF THE E-IN-C (EXECUTIVE IN COUNCIL)
- Shall comprise all officers of the Local Government plus the Raqib and Secretary of all functioning Branches.
- Shall be the highest decision making body at the Local Government Level on all issues except where order from the National, State , the Shariah panel or the Shurah over-rules.
- Shall have power to try and discipline any erring member(s, subject to the approval of the State E-In-C.
- Shall have power to question the activities of the EC at the Local Government Level.
- Shall have power to constitute a disciplinary committee.
- Shall supervise and carry out the general administration of The Congress at the Local Government Level.
- Shall ensure that all the decisions and resolutions at the Annual Congress or Executive-In- Council and Executive meetings are implemented to the letter.
- Shall hold meetings monthly to examine, introspect and direct the affairs of The Congress.
- Quorum for meetings shall be deemed to have been formed once five officers and the Raqib and/or Secretary or representatives of 2/3 of functional branches are represented.
- Shall extend The Congress to parts of the community hitherto unreached and ensure that such extension is nurtured to maturity.
- Shall approve the list of Branch EC as presented by the Raqib

5.3 POWERS AND DUTIES OF OFFICERS

5.3.1 WAKIL
- Shall preside over all meetings of Executive Council and Executive-In-Council.
- Shall have power of final say in the meeting presided by him.
- Shall convey and preside at the annual Local Government Congress of The Congress.
- Shall ensure that necessary reports to The Congress are ready.
- Shall have power to appoint other members of the Local Government EC subject to the approval of the state EC.
- Shall have power to delegate any of his responsibilities to any member for proper implementation.
- Shall have power to query any member of The Congress under his jurisdiction.
- Shall maintain an imprest account of The Congress at Local Government Level as fixed by the Local Government EC.
- Shall present an annual report of events and state of affairs of The Congress at the Annual Congress of the Local Government.

5.3.2 RADIFUL WAKIL
- Shall deputise for the Wakil when such occasion arises.
- Shall play the role of Da’wah Affairs Officer.
- Shall be a representative to the Da’wah Affairs Unit.

5.3.3 SECRETARY
- Shall be the head of the secretariat.
- Shall ensure prompt communication of decisions and resolutions or instructions to appropriate quarters.
- Shall monitor compliance with decisions, resolutions or instructions and make further recommendation to the Wakil and/or Executive Committee.
- Shall prepare draft agenda for meeting and Annual Congress for the consideration of the Wakil.
- Shall prepare the Secretariat report as at and when called for by the Wakil.
- Shall prepare for and present to the E-In-C, in consultation with the Wakil, a progress report and recommend steps for further action.
- Shall receive all correspondence to The Congress at his level and act on them in consultation with the Wakil.
- Shall have power to convene the Local Government Annual Congress in consultation with the Wakil
- Shall be a signatory to the Local Government’s account.
- Shall have power to delegate any of his functions as may be necessary to the Assistant Secretary.
- Shall prepare Annual Secretariat report for the Wakil to be approved by EC.
- Shall maintain an imprest account to be fixed by the EC.

5.3.4 ASSISTANT SECRETARY
- Shall take minutes of meetings.
- Shall ensure that meeting reports are prepared, approved by the Secretary and circulated as stipulated.
- Shall receive reports of all committees for the Secretary.
- Shall deputise for the Secretary and act in such capacity.

5.3.5 FINANCIAL SECRETARY/BUSINESS CHAIRMAN
- Shall be in charge of all financial matters of The Congress and also act as the custodian of all financial documents.
- Shall arrange for sourcing fund and coordinate the effort.
- Shall prepare an annual report to be approved by Executive Committee.
- Shall prepare regular financial briefings for the Wakil, EC and E-In-C.
- Shall head the financial committee to be composed of not more than 5 members.
- Shall be a signatory to The Congress accounts.
- Shall prepare an annual financial budget to be approved by the EC.
- Shall be the Chairman of the Business Committee.
- Shall engage in Halal businesses.
- Shall present new business proposals to EC for ratification
- Shall give quarterly report of all business transactions to the EC

5.3.6 TREASURER
- Shall be in charge of all funds of The Congress
- Shall arrange for sourcing fund and coordinate the effort.
- Shall prepare regular financial briefings on funds for the Wakil.
- Shall keep an imprest account as fixed by the EC.

5.3.7 PROJECT/ASSETS MAINTENANCE OFFICER
- Shall receive and keep all project proposal of the Local Government for regular reference.
- Shall design project plans in conformity with Islamic standard for the approval of the EC.
- Shall execute approved project plan(s) for The Congress.
- Shall handle special task assigned to him by the EC.
- Shall be in charge of all Congress property at Local Government level.
- Shall purchase all property needed and ensure that they are to specification.
- Shall keep record of all materials, their movement and conditions and keep the secretariat briefed on those issues.
- Shall ensure that users of those properties conform to laid down rules and regulation.
- Shall ensure proper maintenance of all assets of The Congress

5.3.8 EDUCATION/LIBRARY OFFICER
- Shall liaise between state Educational Department and other Educational offices at other levels of The Congress.
- Shall study the educational needs of the Local Government and recommend the appropriate educational institution.
- Shall head the educational Committee to be composed of not less than three members.
- Shall work in conjunction with the Library Officer at the State Level for the establishment of Library services as provided by the constitution.
- Shall manage and maintain the Library.
- Shall work in conjunction with the Education Officers and P.R.O at the Local Government Level.

5.3.9 CONGRESS GUARD AFFAIRS OFFICER
- Shall represent the Local Government at the Congress Guard Affairs Department.
- Shall work according to the job specification of the Congress Guard Affairs Department.

5.3.10 CULTURAL AFFAIRS OFFICER
- Shall represent the Local Government at the Cultural Affairs Unit.
- Shall work according to the job specification by Cultural Affairs Unit.

5.3.11 PUBLIC RELATIONS OFFICER
- Shall be the image maker of The Congress at the Local Government Level.
- Shall serve as the liaison officer between The Congress and the public.
- Shall ensure adequate flow of information through the Districts and the branch levels.
- Shall observe the society closely and make report on opportunities and perception of The Congress to the Secretariat for eventual action.

5.3.12 WELFARE OFFICER
- Shall coordinate all welfare activities of The Congress at Local Government Level.
- Shall organise welfare visits at Local Government Level.
- Shall recommend welfare projects to the EC.
- Shall compile data as regards employment and liaise with the employment bureau.

5.3.13 EXTERNAL AFFAIRS OFFICER
- Shall represent the Local Government at the External Affairs Department.
- Shall also work according to the job specification of the external affairs department.`
    },
    {
        title: "SECTION 6: BRANCH LEVEL",
        content: `6.0 BRANCH

6.1 POWERS AND DUTIES OF THE EXECUTIVE COUNCIL
- Shall be responsible for the day-to-day activities of The Congress at the Branch level.
- Shall receive for review and correction all branch reports due for the Branch Annual Congress.
- Shall ensure smooth handing over when change of all, some or one of the office take place and when a committee is dissolved for re-composition.
- Shall meet regularly on monthly basis.
- All executive members at the branch level shall be directly responsible to the Raqib who could advise the EC to approve exchange of official responsibilities.
- Shall initiate ad-hoc committee when necessary and compose its membership.
- Shall stand as the Majlis Shurah to the Raqib.
- Quorum for meetings shall be the presence of the Raqib or his appointed representative and at least 2/3 of officers.

6.2 POWERS AND DUTIES OF BRANCH OFFICERS

6.2.1 RAQIB
- Shall preside over all meetings of Executive Council and general meetings.
- Shall have power of final say in the meeting presided by him.
- Shall have power to appoint other members of the branch Executive Council, excluding the Secretary, subject to the approval of the Local Government Executive Council.
- Shall have power to delegate any of his responsibilities to any member for proper implementation.
- Shall have power to query any member of The Congress under his jurisdiction.
- Shall be a signatory to the account of The Congress at the branch.
- Shall maintain an imprest account as may be fixed by the Executive Council.
- Shall present an annual report of events and state of affairs of The Congress at the Branch Annual Congress.

6.2.2 RADIFU-R-RAQIB
- Shall deputise for the Raqib when such occasion arises.
- Shall play the role of Da’wah Affairs Officer.

6.2.3 SECRETARY
- Shall be the head of the Secretariat.
- Shall ensure prompt communication of decisions, resolution or instructions to appropriate quarters.
- Shall monitor compliance with decisions, resolutions or instructions and make further recommendation to the Raqib or Executive Council.
- Shall prepare draft Agenda for the meeting for the consideration of the Raqib.
- Shall prepare the secretariat report as and when called for by the Raqib.
- Shall receive all correspondence to The Congress at his level and act on them in consultation with the Raqib.
- Shall be a signatory to The Congress account at the Branch Level.
- Shall have power to delegate any of his functions as may be necessary to the Assistant Secretary.
- Shall prepare annual secretariat report for the Raqib to be approved by Executive Council.
- Shall maintain an imprest account as fixed by the Executive Council.
- Shall convene Branch Annual Congress in consultation with the Raqib.

6.2.4 ASSISTANT SECRETARY
- Shall take minutes of meetings.
- Shall ensure that meeting reports are prepared, approved by the Secretary and circulated as stipulated.
- Shall receive reports of all committees for the Secretary.
- Shall deputise and act for the secretary when necessary.
- Shall perform the duties assigned to him by the Secretary.

6.2.5 FINANCIAL SECRETARY
- Shall be in charge of all financial matters of The Congress and the custodian of all financial documents.
- Shall arrange for sourcing fund and co-ordinate the effort.
- Shall prepare an annual financial report for the Raqib towards the Annual Congress of the branch Level to be approved by the Executive Council.
- Shall be a signatory to The Congress accounts.
- Shall prepare an annual financial budget to be approved by the Executive council.

6.2.6 TREASURER
- Shall be in charge of all funds of The Congress
- Shall prepare regular financial briefings on funds for the Wakil, EC and E-In-C.
- Shall keep an imprest account as fixed by the EC.

6.2.7 WELFARE OFFICER
- Shall keep register of members in the branch.
- Shall organise visit to members.
- Shall recommend welfare projects to Executive Council for consideration.
- Shall head the welfare committee of not more than five (5) members.
- Shall attend to problems and complaints of members.

6.2.8 PUBLIC RELATIONS OFFICER
- Shall ensure adequate flow of information to the branch Executive Council.
- Shall make quarterly release of summary of the activities of the branch.
- Shall act as the link between the Branch and other levels of The Congress.

6.2.9 CONGRESS GUARD AFFAIRS OFFICER
- Shall represent the department and co-ordinate its activities at the Branch level.
- Shall work according to the job specifications of the Congress Affairs Department.

6.2.10 ASSETS MAINTENANCE OFFICER
- Shall be in charge of all Branch property.
- Shall purchase all property needed and ensure that they are to specification.
- Shall keep record of all materials, their movement and conditions and keep the secretariat briefed on the issues.
- Shall ensure that users of those properties conform with laid down rules and regulation.
- Shall ensure proper maintenance of all assets of The Congress.

6.2.11 EDUCATION OFFICER
- Shall liaise with the State and Local government Education Officers.
- Shall design and co-ordinate the educational programme of his level in consultation with the state and Local Government Educational Officer.
- Shall head the education committee.`
    },
    {
        title: "SECTION 7: ELECTION PROCESS",
        content: `7.0 ELECTION PROCESS

7.1 ELIGIBILITY
7.1.1 Eligibility for nomination to a post in any level of The Congress shall be:
- Sane adult Male Muslim.
- Financial member of a branch of the Congress
- Absence of any record of misdemeanour Local Govt.

7.1.2 All nomination forms must be signed by the Raqib of the nominee’s branch.

7.2 ELECTION PROCEDURE

7.2.1 BRANCH
- The Electoral Shurah shall be composed by the Local Government Executive Council comprising of maximum of seven (7) but not less than three (3) members.
- The Electoral Shura Chairman shall be selected by the Local Government EC.
- There shall be nomination for two posts only, Raqib and Secretary.
- The Electoral Shura shall elect and recommend two names for each post to the Local Government for final decision.
- The two elected officers shall recommend the names of their cabinet members to the Local Government EC.
- The Local Government shall do the final selection within one month period from the day of submission.

7.2.2 LOCAL GOVERNMENT
- The State Executive Council shall constitute the Shurah with membership of maximum of seven (7) but not less than three (3).
- The Electoral Shura Chairman shall be selected by the State EC.
- There shall be nomination for two posts only; Wakil and Secretary. The nomination shall be from branch only.
- The shurah shall select and recommend two names for each post to the State EC
- The elected Wakil and Secretary shall forward the list of their proposed cabinet to the State EC.
- The State EC shall do the final ratification within one month from the period of submission.

7.2.3 STATE
- The National Executive Council (EC) shall constitute the Electoral Shura with membership of maximum of seven (7) but not less than three (3).
- The Electoral Shurah Chairman shall be selected by National EC
- There shall be nomination for two posts only, Waali and Secretary and the nomination shall be from the Local Government levels.
- The Electoral Shura shall select and recommend two names for each post to the National Executive Council, (EC) for the final decision.
- The state Executive-In-Council must ratify the cabinet members lists before forwarding it to the National.
- The two elected officers shall recommend the list of their cabinet to the National Executive Council.
- The National Executive Council shall do the final ratification within one month period from the day of submission.

7.2.4 NATIONAL
- There shall be an Electoral Shura of not more than seven (7) but not less than three(3) members and composed by the E-In-C.
- There shall be nomination for two posts only, Amir and Secretary General, and the nomination shall be from the States.
- The Electoral Shura shall select the Amir and the Secretary General and present to the Shurah for ratification
- The Electoral Shurah Chairman shall announce the ratified names of Amir and Secretary General at the National Annual Congress.
- The Amir and Secretary General shall present the list of proposed cabinet to the National E-In-C for ratification.

7.3 SPECIAL CONDITION
7.3.1 Wherein any of the aforementioned conditions and qualities is or are not obtainable, The Congress shall appoint any member deemed capable to fill the vacant post(s) through bye-election.
7.3.2 Bye-Elections in Local Government and Branch Levels Shall be conducted by the State E-In-C.
7.3.3 Bye-Election into State Level shall be conducted by National EC.
7.3.4 The Electoral Shurah conducting election into the National office shall not leave the two offices of Amir and Secretary General vacant.
7.3.5 The Shura procedure shall be by simple majority in all elections.
7.3.6 Year as mentioned or referred to in this constitution means and refers to the Hijrah calendar.

7.4 OATH OF OFFICE
On election and acceptance of office, an officer shall take oath as follows:

"I DO SOLEMNLY PLEDGE THAT I WILL DISCHARGE MY RESPONSIBILITY TO THE CONGRESS AND ITS LEADERSHIP TO THE BEST OF MY ABILITY BEARING IN MIND THAT IT IS HELD IN TRUST FOR ALLAH AND I WILL NOT AT ANYTIME BETRAY THIS TRUST. MAY ALLAH BE MY WITNESS."

7.5 RESIGNATION
An officer of The Congress shall be allowed to resign from office following conditions such as: Disciplinary measure, Health, Transfer and Voluntary.

7.6 TERMS OF OFFICE
Subject to other provisions of this constitution, each Executive Council or member shall serve for the following periods at the different levels of The Congress.

7.6.1 GENERAL
- NATIONAL: Each officer shall serve for a period of five (5) years and may be eligible for a maximum of three (3) terms in an office.
- STATE: Each officer shall serve for a period of four (4) years and may be eligible for a maximum of three (3) terms in an office.
- LOCAL GOVT.: Each officer shall serve for a period of three (3) years and may be eligible for a maximum of three (3) terms in an office.
- BRANCH.: Each officer shall serve for a period of two (2) years and may be eligible for a maximum of three (3) terms in an office.

7.6.2 SELECTED OFFICERS
The terms of office of each selected officer shall expire with the term of the elected officers and shall be eligible for a maximum of three terms in that office.`
    },
    {
        title: "SECTION 8: MISCELLANEOUS",
        content: `8.0 MISCELLANEOUS

8.1 GENERAL MEETING
There shall be general meeting at the Branch level on a monthly basis which shall be attended by all members in the Branch.

8.2 FORMATION OF THE CONGRESS AT BRANCH LEVEL

8.2.1 NATURE
The formation of any Branch under The Congress shall take two forms:
- Group of individuals
- Society

A. CONDITIONS FOR GROUP OF INDIVIDUALS
- They must not be less than 5.
- The State EC must have prior knowledge of their intention.
- Must be under the State EC supervision for at least three (3) months.
- Each individual in the group must also meet or fulfil the conditions stated under membership.
- Where Local Government does not exist the State EC shall perform the role of Local Government EC stand above.

B. CONDITIONS FOR SOCIETY
Any society seeking or willing to join The Congress must fulfil the following:
- Each individual in its cabinet must fulfil the conditions stated under membership.
- Intention to join must be made known formally to the Local Government EC. This must be approved through a referendum by the members of the said society.

8.3 CEREMONIAL LAUNCHING
- There shall be a formal launching for every branch.
- The launching will be done after the branch has met the required number of member (20).
- The launching will be conducted by the Local Government within which it is created and should be supervised by the State.

8.4 PROCESS OF REGISTRATION
A form shall be obtained from The Congress supplying the following information:
(i) Name of individual
(ii) Place of work
(iii) Address (contact)
(iv) Profession
(v) Qualification
(vi) Age
(vii) Previous Societies
(viii) Type of membership
(ix) Recommendation
(x) Languages Spoken

8.5 DISCIPLINARY ISSUES

8.5.1 CASES
- Financial impropriety
- Scandal
- Election malpractices petition
- Arbitrary rules/excesses of officers
- Sabotage and clandestine activities

8.5.2 RESOLUTION
In case any of the above is levelled against any officer or member of The Congress, the Executives Committee shall refer the case to the disciplinary committee to investigate the allegation(s) and punishment(s) will be administered based on the advise of the committee. Disciplinary measures may be carried out as stated below.

8.6 SHARIAH & DISCIPLINARY COMMITTEE

8.6.1 SHARIAH PANEL
A. CONDITIONS FOR MEMBERSHIP
- Must be a member of The Congress
- Must be well versed in Islamic jurisprudence
- Must have adequate knowledge of the workings of The Congress
- Must be of good moral character

B. DUTIES OF SHARIAH PANEL
- There shall be a shariah panel at the National Level to be composed by the E-IN-C.
- Members of the panel shall be maximum of 5 but not be less than three.
- Shall be a standing committee with a tenure of seven (7) years.
- Shall sit over all appeal cases arising from States’ and Local Governments’ disciplinary Committees.
- Shall receive and dispense all disciplinary cases at the National level.
- The decisions of the Shariah panel shall be binding on all members of the Congress.

8.6.2 DISCIPLINARY COMMITTEE
- There shall be a disciplinary committee at State and Local Government levels which shall be composed of not less than three (3) and not more than five (5) people who are well versed in the Islamic jurisprudence and of good characters.
- Any erring member shall be referred to the disciplinary committee for appropriate action which may include: Expulsion, suspension, fine, apology or warning etc, or combination of any of these.
- Disciplinary cases at the branch level shall be referred to the local Government disciplinary committee.
- Outcomes of disciplinary Committee at Local Government and state shall be referred to state and national level respectively for final decision.

8.7 FINANCE

8.7.1 SOURCES OF FUND
The Congress shall mobilise resources thus:
- Monthly subscription of members
- Zakat collections
- 10% of collections from Adhkar
- Levy on ITP registration
- Proceeds from a viable investment
- Grants/Aids/Donations from all Organs of TMC
- Stabilisation/consolidation/special levy.
- Sponsorship
- Proceeds from ceremonies
- Launching

8.7.2 COLLECTION OF FUND
The Monthly due of members shall be collected thus;
- Each member of The Congress shall be financially committed to The Congress through the branch.
- Each branch shall forward such mobilised fund to the Local Government Financial Secretary/Treasurer who shall distribute to all levels.

8.7.3 DISTRIBUTION OF DUES
All dues (subscriptions) shall be collected at the Branch Level and shall be disbursed as follows:
- STATE: 20%
- LOCAL GOVERNMENT: 30%
- BRANCH: 50%

8.7.4 FUNDING THE HEADQUARTERS
- The National Headquarters shall thenceforth be funded by the TMC Organs, Adhkar dues, ITP dues, Special levies, and Donations form corporate bodies.
- A budget shall be prepared for the National and spread over the TMC Organs.
- The capacity of each TMC Organs shall be determined by the Finance Office in conjunction with other economic experts of The Congress.

8.7.5 NOTE
The National Executive Council reserves the right to open a stabilisation/consolidation account in any Level(s) that is/are deemed to be financially buoyant.

8.8 EXTERNAL AUDITOR
There shall be an appointed External Auditor to The Congress account at the national level while the Auditor General shall serve as External auditor to all other levels.

8.9 PATRONS

8.9.1 PROVISIONS
- There shall be patrons for all levels of The Congress.
- The Patrons at the National Level must be approved by the National E-IN-C.
- The Patrons of State and Local Government must be approved by the State E-IN-C.
- The Local Government E-IN-C must approve the patrons of the Branch Levels.

8.9.2 CONDITIONS FOR BEING A PATRON
- Readiness to accept the aims, objectives and basis of The Congress.
- Must be ready to follow the Islamic way of life.
- His source of income must be basically Halal.
- His conduct must conform to the social ethics of Islam.

8.9.3 DUTIES OF PATRONS
- To support The Congress physically, morally and financially.
- Shall hold meetings with the officers of The Congress at their levels at least once in a year and as occasion demands.

8.9.4 REMOVAL OF PATRONS
A patron shall cease to be a patron if:
(a) He violates any of the conditions that qualifies him for the office.
(b) On the occasion of death or physical incapability.
(c) On request from the person involved.
(d) There are confirmed reports of activities that are inimical to the progress of The Congress.

8.10 AMENDMENT PROCEDURE
- This constitution shall be subject to review once every five years from the day of its adoption.
- Addendum to this constitution shall be made at any National Annual Congress if deemed necessary subject to 2/3 majority of accredited delegates at the Annual Congress.
- Any approved addendum to the constitution shall only be incorporated into the constitution at the relevant review year.
- Any member of The Congress at the Branch Level shall be competent to make proposal for the amendment through the Executive Council of his branch.
- Such proposals as in 4 above shall be carried by the simple majority of the Executive Council of the Branch and then referred to the State Executive-In-Council.
- Such proposals as in 4 above shall be submitted to the State Executive-iIn-Council at least a month before the State Congress.
- Proposal for amendment from the State shall be sent to the National Executives-in-Council (not later than a month before the National Annual Congress).
- The proposal as in 7 above shall require approval of 2/3 majority of the State Executive-in-Council.
- National E-IN-C as a body can propose an amendment to the constitution provided it is approved by a 2/3 majority of the E-IN-C
- All amendment proposal to the constitution shall be approved by 2/3 majority of the accredited delegates to National Annual Congress

8.11 TMC CALENDAR
- The TMC calendar shall be based on the Hijrah calendar
- For National, the calendar year shall be from Shawwal to Ramadhan
- For State, the calendar year shall be from Sha’aban to Rajab
- For Local Government, the calendar year shall be from Jumadal Thanni to Jumaddal Awwal
- For Branch, the calendar year shall be from Jumaddal Thanni to Jumaddal Awwal`
    }
];

export function ConstitutionContent() {
    const handleDownloadPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = 20;

        // Load Logo
        const logoUrl = "/images/logo.png";
        try {
            const img = new Image();
            img.src = logoUrl;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const imgWidth = 30;
            const imgHeight = 30;
            const xPos = (pageWidth - imgWidth) / 2;

            doc.addImage(img, "PNG", xPos, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
        } catch (error) {
            console.error("Error loading logo for PDF:", error);
        }

        // Helper to add text and manage pagination
        const addText = (text: string, fontSize: number, isBold: boolean = false, align: "left" | "center" = "left", color: [number, number, number] = [0, 0, 0]) => {
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            doc.setTextColor(color[0], color[1], color[2]);

            const lines = doc.splitTextToSize(text, contentWidth);

            // Check if we need a new page
            const lineHeight = fontSize * 0.4; // Approximately converts points to mm
            if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            doc.text(lines, align === "center" ? pageWidth / 2 : margin, yPosition, { align: align });
            yPosition += (lines.length * lineHeight) + 2;
        };

        // Header Text
        addText("THE MUSLIM CONGRESS (TMC)", 18, true, "center", [22, 101, 52]); // Green color
        addText("CONSTITUTION", 14, true, "center");
        yPosition += 5;

        doc.setDrawColor(22, 101, 52); // Green line
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Content
        constitutionSections.forEach((section) => {
            // Check for new page before starting a section title if low on space
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = margin;
            }

            addText(section.title, 12, true, "left", [22, 101, 52]); // Section titles in Green
            yPosition += 2;
            addText(section.content, 10, false, "left", [60, 60, 60]); // Content in dark gray
            yPosition += 5;
        });

        doc.save("TMC_Constitution.pdf");
    };

    return (
        <div className="flex flex-col min-h-screen">
            <PageHeader />
            <main className="flex-1 p-4 md:p-8">
                <Card className="max-w-4xl mx-auto mt-8">
                    <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <CardTitle className="text-3xl text-green-800">The Constitution</CardTitle>
                            <CardDescription>The governing principles and regulations of The Muslim Congress.</CardDescription>
                        </div>
                        <Button
                            onClick={handleDownloadPDF}
                            className="bg-green-700 hover:bg-green-800 text-white flex gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {constitutionSections.map((section, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-lg font-semibold text-left">{section.title}</AccordionTrigger>
                                    <AccordionContent className="whitespace-pre-line text-muted-foreground p-4 bg-muted/30 rounded-lg">
                                        {section.content}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </main>
            <footer className="py-6 border-t mt-8">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p suppressHydrationWarning>&copy; {new Date().getFullYear()} TMC Connect. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
