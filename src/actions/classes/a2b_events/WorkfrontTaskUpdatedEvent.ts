import { A2bEvent } from '../A2bEvent';
import { WORKFRONT_EVENT_CODE } from '../../constants';

export class WorkfrontTaskUpdatedEvent extends A2bEvent {
    constructor(taskData: any) {
        super();
        this.type = WORKFRONT_EVENT_CODE.TASK_UPDATED;
        this.data = taskData;
    }
}
