/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { DepartmentRecord, PersonRecord } from 'types'
import Database from 'better-sqlite3'

type ResponseData = {
	allPeople: PersonRecord[],
	allDepartments: DepartmentRecord[],
	filteredDepartments: DepartmentRecord[]
}

const db = new Database('hashicorp.sqlite')
db.pragma('journal_mode = WAL')

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<ResponseData>
) {
	const { query } = req
	const name = query.name || '';
	const department = query.department || ''

	let selectPeopleStatement = "SELECT * FROM personRecord"
	let parameterValue: string[] = []
	if (name) { // sanitize by using parameterized queries
		selectPeopleStatement += ` WHERE name like ?`;
		parameterValue.push(`%${name}%`);
	}
	
	const allPeople: Array<PersonRecord> = db.prepare<Array<string>, PersonRecord>(selectPeopleStatement).all(...parameterValue)

	let selectDepartmentStatement = "SELECT * FROM department"
	let departmentParameters: string[] = [];
	if (Array.isArray(department)) {
		selectDepartmentStatement += ' WHERE id IN (' + department.map(() => '?').join(', ') + ')';
		departmentParameters.push(...department)
	} else if (department) {
		selectDepartmentStatement +=" WHERE id = ?"
		departmentParameters.push(department)
	}

	const allDepartments: Array<DepartmentRecord> = db.prepare<Array<string>, DepartmentRecord>('SELECT * FROM department').all()

	const filteredDepartments: Array<DepartmentRecord> = db.prepare<Array<string>, DepartmentRecord>(selectDepartmentStatement).all(...departmentParameters)
	res.status(200).json({ allPeople, allDepartments, filteredDepartments })
}
