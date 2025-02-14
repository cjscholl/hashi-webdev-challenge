/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import React, { useState, useEffect } from 'react'
import { GetStaticPropsResult } from 'next'
import { PersonRecord, DepartmentNode, DepartmentTree, Department, DepartmentRecord } from 'types'
import BaseLayout from '../../layouts/base'
import { useRouter } from 'next/router'
import {
	filterPeople,
	findDepartments,
	departmentRecordsToDepartmentTree,
} from '../../utilities'

import Profile from 'components/profile'
import Search from 'components/search'
import DepartmentFilter from 'components/departmentFilter';
import s from './style.module.css'

interface Props {
	allPeople: PersonRecord[]
	departmentTree: DepartmentTree
}

export async function getStaticProps(): Promise<GetStaticPropsResult<Props>> {
	const fetchResponse = await fetch('http://localhost:3000/api/hashicorp');
	const results: {allPeople: PersonRecord[], allDepartments: DepartmentRecord[], filteredDepartments: DepartmentRecord[]} = await fetchResponse.json();

	return {
		props: {
			allPeople: results.allPeople,
			departmentTree: departmentRecordsToDepartmentTree(results.allDepartments),
		},
	}
}

export default function PeoplePage({
	allPeople = [],
	departmentTree = [],
}: Props): React.ReactElement {
	const router = useRouter();
	const [searchingName, setSearchingName] = useState<string>('')
	const [hideNoPicture, setHideNoPicture] = useState(false)
	const [filteredDepartments, setFilteredDepartments] = useState<Array<Department>>([]);
	const [people, setPeople] = useState(allPeople);
	const peopleFiltered = filterPeople(
		people,
		hideNoPicture,
		filteredDepartments
	)

	const filteredDepartmentIds = filteredDepartments.reduce(
		(acc: string[], department: DepartmentNode) => [...acc, department?.id],
		[]
	)

	const personDepartment = (personDeptId) => {
		const depts = findDepartments(departmentTree, personDeptId)
		return depts[depts.length-1]?.name
	} 
	useEffect(() => {
		if (router.query.name || router.query.department) {
			setSearchingName(router.query.name as string)
			if (Array.isArray(router.query.department)){
				let depts = []
				for (let id of router.query.department) {
					depts.push(...findDepartments(departmentTree, id))
				}
				setFilteredDepartments(depts)
			}	
			else if (router.query.department) {
				const dept = findDepartments(departmentTree, router.query.department)
				setFilteredDepartments(dept)
			} else {
				setFilteredDepartments([])
			}

			const apiFetch = async () => {
				const params = new URLSearchParams();
				if (Array.isArray(router.query.department)) {
					router.query.department.forEach(item => {
						params.append('department', item);
					});
				}
				else {
					if (router.query.department) {
						params.append('department', router.query.department);
					}
				}
				if (router.query.name) {
					params.append('name', router.query.name as string);
				}
				const result = await fetch(`/api/hashicorp${params && '?' + params.toString()}`);
				const filteredPeople = await result.json()
				setPeople(filteredPeople.allPeople);
			}
			apiFetch()
		}
	}, [router.query.name, router.query.department])
	return (
		<main className="g-grid-container">
			<div>
				<div>
					<h1>HashiCorp Humans</h1>
					<span>Find a HashiCorp human</span>
				</div>
				<Search
					value={searchingName}
					onInputChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
						setSearchingName(e.target.value)
					
						router.push({
							pathname: '/people', 
							query: {
							  name: e.target.value || undefined,
							  department: filteredDepartmentIds
							},
						});
						
					}}
					onProfileChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setHideNoPicture(e.target.checked)
					}
				/>
			</div>
			<div className={s.flex}>
				<aside>
					<DepartmentFilter
						filteredDepartmentIds={filteredDepartmentIds}
						clearFiltersHandler={() => {
							setFilteredDepartments([])
							router.push({
								pathname: '/people', 
								query: {
								  name: searchingName,
								  department: []
							}})
						}}
						selectFilterHandler={(departmentFilter: Department) => {
							const totalDepartmentFilter = findDepartments(
								departmentTree,
								departmentFilter.id
							)
							setFilteredDepartments(totalDepartmentFilter)
							const deptIds = totalDepartmentFilter.map(dept => dept.id)
							router.push({
								pathname: '/people', 
								query: {
								  name: searchingName,
								  department: deptIds
							}})
						}}
						departmentTree={departmentTree}
					/>
				</aside>
				<div className={s.people}>
					{peopleFiltered.length === 0 && (
						<div>
							<span>No results found.</span>
						</div>
					)}
					{peopleFiltered.map((person: PersonRecord) => {
						return (
							
								<Profile
									imgUrl={person?.avatarUrl}
									name={person.name}
									title={person.title}
									department={personDepartment(person.departmentId)}
								/>
						)
					})}
				</div>
			</div>
		</main>
	)
}

PeoplePage.layout = BaseLayout
