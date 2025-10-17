import { A2bEvent } from '../A2bEvent';
import { WORKFRONT_EVENT_CODE } from '../../constants';

export class WorkfrontTaskCompletedEvent extends A2bEvent {
    constructor(taskData: any) {
        super();
        this.type = WORKFRONT_EVENT_CODE.TASK_COMPLETED;
        this.data = taskData;
    }
}
