/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

export interface SearchProps {
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
	value: string
}

export default function Search({
	onInputChange,
	onProfileChange,
	value
}: SearchProps) {
	return (
		<>
			<input
				value={value}
				type="text"
				placeholder="Search people by name"
				onChange={onInputChange}
			/>

			<div>
				<input type="button" onChange={onProfileChange} />
				<div>Hide people missing a profile image</div>
			</div>
		</>
	)
}
