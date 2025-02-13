/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * NOTE: This script is only to be used by senior candidates
 */

import Database from 'better-sqlite3'
import { executeQuery } from '@datocms/cda-client'
import 'dotenv/config'
import { DepartmentRecord, PersonRecord } from 'types'

const query = `query {
	allDepartments(first: 100) {
		name
		id
		parent {
			name
			id
		}
	}

	allPeople(first: 100) {
		id
		name
		title
		avatar {
			url
		}
		department {
			name
		}
	}
}`

const DATO_API_TOKEN = process.env.DATO_API_TOKEN // the Dato API token is provided in your Discord channel

async function main() {
	// API Docs: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
	const db = new Database('hashicorp.sqlite')
	db.pragma('journal_mode = WAL')

	//Docs here: https://github.com/datocms/cda-client
	const results: {
		allDepartments: DepartmentRecord[]
		allPeople: PersonRecord[]
	} = await executeQuery(query, {
		token: DATO_API_TOKEN,
	})
	// Sr. candidate TODO: Insert data into the database

	const createDepartmentTable = db.prepare(
		'CREATE TABLE IF NOT EXISTS department (id TEXT PRIMARY KEY, name TEXT, parentId TEXT )'
	)
	createDepartmentTable.run()

	const createPersonTable = db.prepare(
		'CREATE TABLE IF NOT EXISTS personRecord (id TEXT PRIMARY KEY, name TEXT, title TEXT, avatarUrl TEXT, avatarAlt TEXT, departmentId TEXT, FOREIGN KEY (departmentId) REFERENCES department (id))'
	)
	createPersonTable.run()

	const insertDepartment = db.prepare(
		'INSERT INTO department VALUES ($id, $name, $parentId)'
	)
	const insertManyDepartment = db.transaction(
		(data: Array<DepartmentRecord>) => {
			for (const obj of data) {
				insertDepartment.run({
					id: obj.id,
					name: obj.name,
					parentId: obj.parent?.id,
				})
			}
		}
	)
	insertManyDepartment(results.allDepartments)

	const insertPerson = db.prepare(
		'INSERT INTO personRecord VALUES ($id, $name, $title, $avatarUrl, $avatarAlt, $departmentId)'
	)
	const insertManyPerson = db.transaction((data: Array<PersonRecord>) => {
		for (const obj of data) {
			const department = results.allDepartments.find(
				(dept) => dept.name === obj.department?.name
			)
			insertPerson.run({
				id: obj.id,
				name: obj.name,
				title: obj.title,
				avatarUrl: obj.avatar?.url,
				avatarAlt: obj.avatar?.alt,
				departmentId: department?.id,
			})
		}
	})

	insertManyPerson(results.allPeople)

	const verifyInsertDepartment = db.prepare('SELECT * FROM department').all()
	console.log(verifyInsertDepartment)

	const verifyInsert = db.prepare('SELECT * FROM personRecord').all()
	console.log(verifyInsert)
}
main()
