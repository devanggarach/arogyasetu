export const VACCINE_NAME = {
	COVACIN: 'covacin',
	COVISHEILD: 'covishield',
	COVOVAX: 'covovax',
	SPUTNIKV: 'sputnikv',
	CORBEVAX: 'corbevax',
	INCOVACC: 'incovacc',
};
export type IVacineName = (typeof VACCINE_NAME)[keyof typeof VACCINE_NAME];
export const VACCINE: Record<
	IVacineName,
	{
		dose: number;
		gap: number; // days
	}
> = {
	[VACCINE_NAME.COVACIN]: {
		dose: 2,
		gap: 60,
	},
	[VACCINE_NAME.COVISHEILD]: {
		dose: 2,
		gap: 60,
	},
	[VACCINE_NAME.COVOVAX]: {
		dose: 2,
		gap: 60,
	},
	[VACCINE_NAME.INCOVACC]: {
		dose: 2,
		gap: 60,
	},
};

export const SETURA_SLOT_STATUS = {
	AVAILABLE: 0,
	FULL: 1,
	CANCELLED: 2,
};

export const SETURA_VACCIANTED_STATUS = {
	NONE: 0,
	FIRST: 1,
	SECOND: 2,
	THIRD: 3,
	FOURTH: 4,
	FIFTH: 5,
	SIXTH: 6,
	FULLY_VACCINATED: -1,
};
